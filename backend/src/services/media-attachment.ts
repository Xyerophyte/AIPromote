import { z } from 'zod';
import { config } from '../config/config';
import { ValidationError } from '../utils/errors';
import * as AWS from 'aws-sdk';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

export interface MediaAttachment {
  id: string;
  organizationId: string;
  originalName: string;
  filename: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'gif';
  mimeType: string;
  size: number; // bytes
  dimensions?: {
    width: number;
    height: number;
    duration?: number; // for videos/audio in seconds
  };
  storage: {
    provider: 'aws_s3' | 'cloudinary' | 'local';
    bucket?: string;
    key: string;
    url: string;
    thumbnailUrl?: string;
  };
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    variants: MediaVariant[];
    optimizations: {
      compressed: boolean;
      resized: boolean;
      formatted: boolean;
      watermarked: boolean;
    };
    metadata: {
      exif?: any;
      colorProfile?: string;
      bitrate?: number;
      fps?: number;
    };
  };
  usage: {
    platforms: string[];
    contentPieces: string[];
    campaigns: string[];
    timesUsed: number;
    lastUsed?: Date;
  };
  accessibility: {
    altText?: string;
    caption?: string;
    transcript?: string; // for videos/audio
  };
  compliance: {
    hasRights: boolean;
    source?: string;
    license?: string;
    restrictions?: string[];
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaVariant {
  id: string;
  type: 'thumbnail' | 'compressed' | 'platform_optimized' | 'watermarked';
  platform?: string; // if platform-specific
  specifications: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    size?: number;
  };
  storage: {
    key: string;
    url: string;
  };
  createdAt: Date;
}

export interface MediaUploadRequest {
  organizationId: string;
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
  metadata?: {
    altText?: string;
    caption?: string;
    tags?: string[];
    source?: string;
    license?: string;
    hasRights?: boolean;
  };
  processing?: {
    generateThumbnail?: boolean;
    compress?: boolean;
    resize?: { width?: number; height?: number };
    watermark?: { text?: string; image?: string };
    platformOptimizations?: string[];
  };
}

export interface MediaProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: string;
  };
  compression?: {
    quality?: number;
    progressive?: boolean;
    optimizeHuffman?: boolean;
  };
  format?: {
    output?: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'svg';
    lossless?: boolean;
  };
  watermark?: {
    type: 'text' | 'image';
    content: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
  };
  platformOptimization?: {
    platform: string;
    contentType: 'post' | 'story' | 'cover' | 'profile' | 'thumbnail';
  };
}

export interface PlatformMediaRequirements {
  [platform: string]: {
    [contentType: string]: {
      image?: {
        maxSize: number; // bytes
        maxDimensions: { width: number; height: number };
        minDimensions: { width: number; height: number };
        aspectRatios: string[]; // e.g., ['1:1', '4:5', '16:9']
        formats: string[];
      };
      video?: {
        maxSize: number;
        maxDuration: number; // seconds
        maxDimensions: { width: number; height: number };
        minDimensions: { width: number; height: number };
        aspectRatios: string[];
        formats: string[];
        maxBitrate?: number;
        audioRequired?: boolean;
      };
    };
  };
}

export interface MediaLibraryFilters {
  type?: string[];
  mimeType?: string[];
  tags?: string[];
  platforms?: string[];
  dateRange?: {
    start: Date;
    end: Date;
    field: 'created' | 'updated' | 'lastUsed';
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  dimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  hasAltText?: boolean;
  hasRights?: boolean;
  processingStatus?: string[];
  usage?: {
    minUsage?: number;
    maxUsage?: number;
    unused?: boolean;
  };
  sortBy?: 'created' | 'updated' | 'name' | 'size' | 'usage';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const MediaUploadRequestSchema = z.object({
  organizationId: z.string(),
  file: z.object({
    buffer: z.instanceof(Buffer),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number().positive(),
  }),
  metadata: z.object({
    altText: z.string().optional(),
    caption: z.string().optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
    license: z.string().optional(),
    hasRights: z.boolean().optional(),
  }).optional(),
  processing: z.object({
    generateThumbnail: z.boolean().default(true),
    compress: z.boolean().default(true),
    resize: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    watermark: z.object({
      text: z.string().optional(),
      image: z.string().optional(),
    }).optional(),
    platformOptimizations: z.array(z.string()).optional(),
  }).optional(),
});

export class MediaAttachmentService {
  private s3: AWS.S3;
  private bucket: string;
  private platformRequirements: PlatformMediaRequirements;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.bucket = process.env.S3_BUCKET || 'aipromotor-media';
    this.platformRequirements = this.initializePlatformRequirements();
  }

  private initializePlatformRequirements(): PlatformMediaRequirements {
    return {
      INSTAGRAM: {
        post: {
          image: {
            maxSize: 30 * 1024 * 1024, // 30MB
            maxDimensions: { width: 1080, height: 1080 },
            minDimensions: { width: 320, height: 320 },
            aspectRatios: ['1:1', '4:5', '1.91:1'],
            formats: ['jpeg', 'jpg', 'png'],
          },
          video: {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxDuration: 60,
            maxDimensions: { width: 1080, height: 1920 },
            minDimensions: { width: 320, height: 320 },
            aspectRatios: ['1:1', '4:5', '9:16'],
            formats: ['mp4', 'mov'],
            audioRequired: false,
          },
        },
        story: {
          image: {
            maxSize: 30 * 1024 * 1024,
            maxDimensions: { width: 1080, height: 1920 },
            minDimensions: { width: 320, height: 568 },
            aspectRatios: ['9:16'],
            formats: ['jpeg', 'jpg', 'png'],
          },
          video: {
            maxSize: 100 * 1024 * 1024,
            maxDuration: 15,
            maxDimensions: { width: 1080, height: 1920 },
            minDimensions: { width: 320, height: 568 },
            aspectRatios: ['9:16'],
            formats: ['mp4', 'mov'],
            audioRequired: false,
          },
        },
      },
      TWITTER: {
        post: {
          image: {
            maxSize: 5 * 1024 * 1024, // 5MB
            maxDimensions: { width: 1024, height: 512 },
            minDimensions: { width: 320, height: 160 },
            aspectRatios: ['2:1', '1:1'],
            formats: ['jpeg', 'jpg', 'png', 'gif'],
          },
          video: {
            maxSize: 512 * 1024 * 1024, // 512MB
            maxDuration: 140,
            maxDimensions: { width: 1920, height: 1080 },
            minDimensions: { width: 32, height: 32 },
            aspectRatios: ['16:9', '1:1', '9:16'],
            formats: ['mp4', 'mov'],
            audioRequired: false,
          },
        },
      },
      LINKEDIN: {
        post: {
          image: {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxDimensions: { width: 1200, height: 1200 },
            minDimensions: { width: 520, height: 320 },
            aspectRatios: ['1.91:1', '1:1'],
            formats: ['jpeg', 'jpg', 'png', 'gif'],
          },
          video: {
            maxSize: 5 * 1024 * 1024 * 1024, // 5GB
            maxDuration: 600, // 10 minutes
            maxDimensions: { width: 1920, height: 1080 },
            minDimensions: { width: 256, height: 144 },
            aspectRatios: ['16:9', '1:1', '9:16', '4:5', '2:3'],
            formats: ['mp4', 'mov', 'avi'],
            audioRequired: false,
          },
        },
      },
      TIKTOK: {
        post: {
          video: {
            maxSize: 287.6 * 1024 * 1024, // 287.6MB
            maxDuration: 180, // 3 minutes
            maxDimensions: { width: 1080, height: 1920 },
            minDimensions: { width: 540, height: 960 },
            aspectRatios: ['9:16'],
            formats: ['mp4', 'mov'],
            audioRequired: true,
          },
        },
      },
      YOUTUBE_SHORTS: {
        post: {
          video: {
            maxSize: 256 * 1024 * 1024, // 256MB
            maxDuration: 60,
            maxDimensions: { width: 1080, height: 1920 },
            minDimensions: { width: 480, height: 854 },
            aspectRatios: ['9:16'],
            formats: ['mp4', 'mov', 'avi'],
            audioRequired: false,
          },
        },
      },
    };
  }

  async uploadMedia(request: MediaUploadRequest): Promise<MediaAttachment> {
    try {
      const validatedRequest = MediaUploadRequestSchema.parse(request);
      
      // Validate file type and size
      this.validateFile(validatedRequest.file);
      
      // Generate unique filename
      const fileExtension = this.getFileExtension(validatedRequest.file.originalName);
      const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const key = `media/${validatedRequest.organizationId}/${filename}`;

      // Upload to S3
      const uploadResult = await this.uploadToS3(validatedRequest.file.buffer, key, validatedRequest.file.mimeType);

      // Get file dimensions and metadata
      const dimensions = await this.getMediaDimensions(validatedRequest.file.buffer, validatedRequest.file.mimeType);
      const metadata = await this.extractMediaMetadata(validatedRequest.file.buffer, validatedRequest.file.mimeType);

      // Create media attachment record
      const mediaAttachment: MediaAttachment = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: validatedRequest.organizationId,
        originalName: validatedRequest.file.originalName,
        filename,
        type: this.getMediaType(validatedRequest.file.mimeType),
        mimeType: validatedRequest.file.mimeType,
        size: validatedRequest.file.size,
        dimensions,
        storage: {
          provider: 'aws_s3',
          bucket: this.bucket,
          key,
          url: uploadResult.Location!,
        },
        processing: {
          status: 'pending',
          variants: [],
          optimizations: {
            compressed: false,
            resized: false,
            formatted: false,
            watermarked: false,
          },
          metadata,
        },
        usage: {
          platforms: [],
          contentPieces: [],
          campaigns: [],
          timesUsed: 0,
        },
        accessibility: {
          altText: validatedRequest.metadata?.altText,
          caption: validatedRequest.metadata?.caption,
        },
        compliance: {
          hasRights: validatedRequest.metadata?.hasRights ?? false,
          source: validatedRequest.metadata?.source,
          license: validatedRequest.metadata?.license,
        },
        tags: validatedRequest.metadata?.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Process media if requested
      if (validatedRequest.processing) {
        await this.processMedia(mediaAttachment, validatedRequest.processing);
      }

      // In real implementation: save to database
      // await prisma.mediaAttachment.create({ data: mediaAttachment });

      return mediaAttachment;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid upload request', 'request', error.errors);
      }
      throw error;
    }
  }

  async processMedia(
    mediaAttachment: MediaAttachment, 
    options: MediaUploadRequest['processing']
  ): Promise<MediaAttachment> {
    try {
      mediaAttachment.processing.status = 'processing';
      
      // Download original file for processing
      const originalBuffer = await this.downloadFromS3(mediaAttachment.storage.key);
      
      const variants: MediaVariant[] = [];

      // Generate thumbnail if requested
      if (options?.generateThumbnail && mediaAttachment.type === 'image') {
        const thumbnailVariant = await this.generateThumbnail(originalBuffer, mediaAttachment);
        variants.push(thumbnailVariant);
        mediaAttachment.storage.thumbnailUrl = thumbnailVariant.storage.url;
      }

      // Compress if requested
      if (options?.compress && mediaAttachment.type === 'image') {
        const compressedVariant = await this.compressImage(originalBuffer, mediaAttachment);
        variants.push(compressedVariant);
        mediaAttachment.processing.optimizations.compressed = true;
      }

      // Resize if requested
      if (options?.resize && mediaAttachment.type === 'image') {
        const resizedVariant = await this.resizeImage(originalBuffer, mediaAttachment, options.resize);
        variants.push(resizedVariant);
        mediaAttachment.processing.optimizations.resized = true;
      }

      // Add watermark if requested
      if (options?.watermark && mediaAttachment.type === 'image') {
        const watermarkedVariant = await this.addWatermark(originalBuffer, mediaAttachment, options.watermark);
        variants.push(watermarkedVariant);
        mediaAttachment.processing.optimizations.watermarked = true;
      }

      // Generate platform-optimized variants
      if (options?.platformOptimizations) {
        for (const platform of options.platformOptimizations) {
          const platformVariants = await this.generatePlatformOptimizedVariants(originalBuffer, mediaAttachment, platform);
          variants.push(...platformVariants);
        }
      }

      mediaAttachment.processing.variants = variants;
      mediaAttachment.processing.status = 'completed';
      mediaAttachment.updatedAt = new Date();

      // In real implementation: update database
      // await prisma.mediaAttachment.update({ where: { id: mediaAttachment.id }, data: mediaAttachment });

      return mediaAttachment;
    } catch (error) {
      mediaAttachment.processing.status = 'failed';
      throw error;
    }
  }

  async getMediaLibrary(
    organizationId: string, 
    filters: MediaLibraryFilters
  ): Promise<{
    media: MediaAttachment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Mock implementation - in real implementation, query database with filters
    const mockMedia: MediaAttachment[] = [];
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = mockMedia.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginatedMedia = mockMedia.slice(startIndex, startIndex + limit);

    return {
      media: paginatedMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async validateForPlatform(
    mediaId: string, 
    platform: string, 
    contentType: string
  ): Promise<{
    isValid: boolean;
    violations: string[];
    suggestions: string[];
    canOptimize: boolean;
  }> {
    // Get media attachment
    const media = await this.getMediaById(mediaId);
    if (!media) {
      throw new ValidationError('Media not found', 'mediaId', mediaId);
    }

    const requirements = this.platformRequirements[platform]?.[contentType];
    if (!requirements) {
      return {
        isValid: false,
        violations: ['Platform/content type not supported'],
        suggestions: [],
        canOptimize: false,
      };
    }

    const violations: string[] = [];
    const suggestions: string[] = [];
    
    const mediaReqs = requirements[media.type as 'image' | 'video'];
    if (!mediaReqs) {
      violations.push(`${media.type} not supported for ${platform} ${contentType}`);
      return {
        isValid: false,
        violations,
        suggestions: [`Consider using a different media type`],
        canOptimize: false,
      };
    }

    // Check file size
    if (media.size > mediaReqs.maxSize) {
      violations.push(`File size ${this.formatBytes(media.size)} exceeds maximum ${this.formatBytes(mediaReqs.maxSize)}`);
      suggestions.push('Compress the file or use a smaller version');
    }

    // Check dimensions
    if (media.dimensions) {
      if (media.dimensions.width > mediaReqs.maxDimensions.width || 
          media.dimensions.height > mediaReqs.maxDimensions.height) {
        violations.push(`Dimensions ${media.dimensions.width}x${media.dimensions.height} exceed maximum ${mediaReqs.maxDimensions.width}x${mediaReqs.maxDimensions.height}`);
        suggestions.push('Resize the media to fit platform requirements');
      }

      if (media.dimensions.width < mediaReqs.minDimensions.width || 
          media.dimensions.height < mediaReqs.minDimensions.height) {
        violations.push(`Dimensions ${media.dimensions.width}x${media.dimensions.height} below minimum ${mediaReqs.minDimensions.width}x${mediaReqs.minDimensions.height}`);
        suggestions.push('Use a higher resolution version');
      }

      // Check aspect ratio
      const aspectRatio = (media.dimensions.width / media.dimensions.height).toFixed(2);
      const supportedRatios = mediaReqs.aspectRatios.map(ratio => {
        const [w, h] = ratio.split(':').map(Number);
        return (w / h).toFixed(2);
      });
      
      if (!supportedRatios.includes(aspectRatio)) {
        violations.push(`Aspect ratio ${aspectRatio} not in supported ratios: ${mediaReqs.aspectRatios.join(', ')}`);
        suggestions.push('Crop or resize to a supported aspect ratio');
      }
    }

    // Check format
    const fileExtension = this.getFileExtension(media.filename);
    if (!mediaReqs.formats.includes(fileExtension.toLowerCase())) {
      violations.push(`Format ${fileExtension} not supported. Supported formats: ${mediaReqs.formats.join(', ')}`);
      suggestions.push('Convert to a supported format');
    }

    // Check video-specific requirements
    if (media.type === 'video' && 'maxDuration' in mediaReqs) {
      if (media.dimensions?.duration && media.dimensions.duration > mediaReqs.maxDuration) {
        violations.push(`Duration ${media.dimensions.duration}s exceeds maximum ${mediaReqs.maxDuration}s`);
        suggestions.push('Trim the video to fit duration requirements');
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      canOptimize: violations.length > 0, // Can optimize if there are violations
    };
  }

  async optimizeForPlatform(
    mediaId: string, 
    platform: string, 
    contentType: string
  ): Promise<MediaAttachment> {
    const media = await this.getMediaById(mediaId);
    if (!media) {
      throw new ValidationError('Media not found', 'mediaId', mediaId);
    }

    const requirements = this.platformRequirements[platform]?.[contentType];
    if (!requirements) {
      throw new ValidationError('Platform/content type not supported', 'platform', `${platform}/${contentType}`);
    }

    // Download original media
    const originalBuffer = await this.downloadFromS3(media.storage.key);
    
    // Generate optimized variants
    const platformVariants = await this.generatePlatformOptimizedVariants(originalBuffer, media, platform, contentType);
    
    // Add variants to media
    media.processing.variants.push(...platformVariants);
    media.updatedAt = new Date();

    // In real implementation: update database
    // await prisma.mediaAttachment.update({ where: { id: mediaId }, data: media });

    return media;
  }

  async deleteMedia(mediaId: string, organizationId: string): Promise<boolean> {
    const media = await this.getMediaById(mediaId);
    if (!media) {
      throw new ValidationError('Media not found', 'mediaId', mediaId);
    }

    if (media.organizationId !== organizationId) {
      throw new ValidationError('Access denied', 'organizationId', 'Media belongs to different organization');
    }

    // Delete from S3
    await this.deleteFromS3(media.storage.key);
    
    // Delete variants
    for (const variant of media.processing.variants) {
      await this.deleteFromS3(variant.storage.key);
    }

    // In real implementation: delete from database
    // await prisma.mediaAttachment.delete({ where: { id: mediaId } });

    return true;
  }

  async updateMediaMetadata(
    mediaId: string, 
    organizationId: string, 
    updates: {
      altText?: string;
      caption?: string;
      tags?: string[];
      hasRights?: boolean;
      source?: string;
      license?: string;
    }
  ): Promise<MediaAttachment> {
    const media = await this.getMediaById(mediaId);
    if (!media) {
      throw new ValidationError('Media not found', 'mediaId', mediaId);
    }

    if (media.organizationId !== organizationId) {
      throw new ValidationError('Access denied', 'organizationId', 'Media belongs to different organization');
    }

    // Update metadata
    if (updates.altText !== undefined) media.accessibility.altText = updates.altText;
    if (updates.caption !== undefined) media.accessibility.caption = updates.caption;
    if (updates.tags !== undefined) media.tags = updates.tags;
    if (updates.hasRights !== undefined) media.compliance.hasRights = updates.hasRights;
    if (updates.source !== undefined) media.compliance.source = updates.source;
    if (updates.license !== undefined) media.compliance.license = updates.license;
    
    media.updatedAt = new Date();

    // In real implementation: update database
    // await prisma.mediaAttachment.update({ where: { id: mediaId }, data: media });

    return media;
  }

  private async getMediaById(id: string): Promise<MediaAttachment | null> {
    // In real implementation: fetch from database
    return null;
  }

  private validateFile(file: { buffer: Buffer; originalName: string; mimeType: string; size: number }) {
    // Check file size (max 1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      throw new ValidationError('File too large', 'size', `Maximum size is ${this.formatBytes(maxSize)}`);
    }

    // Check mime type
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/aac',
      'application/pdf', 'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimeType)) {
      throw new ValidationError('Unsupported file type', 'mimeType', file.mimeType);
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'gif' {
    if (mimeType.startsWith('image/')) {
      return mimeType === 'image/gif' ? 'gif' : 'image';
    }
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<AWS.S3.ManagedUpload.SendData> {
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    };

    return this.s3.upload(uploadParams).promise();
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    const result = await this.s3.getObject(params).promise();
    return result.Body as Buffer;
  }

  private async deleteFromS3(key: string): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  private async getMediaDimensions(buffer: Buffer, mimeType: string): Promise<MediaAttachment['dimensions']> {
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        return {
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      } catch (error) {
        return undefined;
      }
    }

    // For video files, you would use ffprobe or similar
    // This is a simplified mock implementation
    if (mimeType.startsWith('video/')) {
      return {
        width: 1920,
        height: 1080,
        duration: 30, // Mock duration
      };
    }

    return undefined;
  }

  private async extractMediaMetadata(buffer: Buffer, mimeType: string): Promise<any> {
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        return {
          format: metadata.format,
          colorProfile: metadata.icc?.description,
          density: metadata.density,
        };
      } catch (error) {
        return {};
      }
    }

    return {};
  }

  private async generateThumbnail(buffer: Buffer, media: MediaAttachment): Promise<MediaVariant> {
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `thumbnails/${media.organizationId}/thumb_${media.filename}`;
    const uploadResult = await this.uploadToS3(thumbnailBuffer, key, 'image/jpeg');

    return {
      id: `variant_${Date.now()}_thumb`,
      type: 'thumbnail',
      specifications: {
        width: 300,
        height: 300,
        quality: 80,
        format: 'jpeg',
        size: thumbnailBuffer.length,
      },
      storage: {
        key,
        url: uploadResult.Location!,
      },
      createdAt: new Date(),
    };
  }

  private async compressImage(buffer: Buffer, media: MediaAttachment, quality = 80): Promise<MediaVariant> {
    const compressedBuffer = await sharp(buffer)
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const key = `compressed/${media.organizationId}/comp_${media.filename}`;
    const uploadResult = await this.uploadToS3(compressedBuffer, key, 'image/jpeg');

    return {
      id: `variant_${Date.now()}_compressed`,
      type: 'compressed',
      specifications: {
        quality,
        format: 'jpeg',
        size: compressedBuffer.length,
      },
      storage: {
        key,
        url: uploadResult.Location!,
      },
      createdAt: new Date(),
    };
  }

  private async resizeImage(
    buffer: Buffer, 
    media: MediaAttachment, 
    resize: { width?: number; height?: number }
  ): Promise<MediaVariant> {
    const resizedBuffer = await sharp(buffer)
      .resize(resize.width, resize.height, { fit: 'inside' })
      .toBuffer();

    const key = `resized/${media.organizationId}/resized_${media.filename}`;
    const uploadResult = await this.uploadToS3(resizedBuffer, key, media.mimeType);

    return {
      id: `variant_${Date.now()}_resized`,
      type: 'compressed',
      specifications: {
        width: resize.width,
        height: resize.height,
        size: resizedBuffer.length,
      },
      storage: {
        key,
        url: uploadResult.Location!,
      },
      createdAt: new Date(),
    };
  }

  private async addWatermark(
    buffer: Buffer, 
    media: MediaAttachment, 
    watermark: { text?: string; image?: string }
  ): Promise<MediaVariant> {
    let watermarkedBuffer: Buffer;

    if (watermark.text) {
      // Add text watermark
      watermarkedBuffer = await sharp(buffer)
        .composite([{
          input: Buffer.from(`
            <svg width="200" height="50">
              <text x="10" y="25" font-family="Arial" font-size="16" fill="white" opacity="0.5">
                ${watermark.text}
              </text>
            </svg>
          `),
          gravity: 'southeast',
        }])
        .toBuffer();
    } else {
      // For image watermarks, you'd need the watermark image
      watermarkedBuffer = buffer;
    }

    const key = `watermarked/${media.organizationId}/wm_${media.filename}`;
    const uploadResult = await this.uploadToS3(watermarkedBuffer, key, media.mimeType);

    return {
      id: `variant_${Date.now()}_watermarked`,
      type: 'watermarked',
      specifications: {
        size: watermarkedBuffer.length,
      },
      storage: {
        key,
        url: uploadResult.Location!,
      },
      createdAt: new Date(),
    };
  }

  private async generatePlatformOptimizedVariants(
    buffer: Buffer, 
    media: MediaAttachment, 
    platform: string, 
    contentType = 'post'
  ): Promise<MediaVariant[]> {
    const variants: MediaVariant[] = [];
    const requirements = this.platformRequirements[platform]?.[contentType];
    
    if (!requirements || !requirements[media.type as 'image' | 'video']) {
      return variants;
    }

    const mediaReqs = requirements[media.type as 'image' | 'video']!;

    // Generate variants for each supported aspect ratio
    for (const aspectRatio of mediaReqs.aspectRatios) {
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      
      // Calculate target dimensions
      const targetWidth = Math.min(mediaReqs.maxDimensions.width, 1080);
      const targetHeight = Math.round(targetWidth * (heightRatio / widthRatio));

      if (media.type === 'image') {
        const optimizedBuffer = await sharp(buffer)
          .resize(targetWidth, targetHeight, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();

        const key = `optimized/${media.organizationId}/${platform}_${aspectRatio.replace(':', 'x')}_${media.filename}`;
        const uploadResult = await this.uploadToS3(optimizedBuffer, key, 'image/jpeg');

        variants.push({
          id: `variant_${Date.now()}_${platform}_${aspectRatio.replace(':', 'x')}`,
          type: 'platform_optimized',
          platform,
          specifications: {
            width: targetWidth,
            height: targetHeight,
            quality: 85,
            format: 'jpeg',
            size: optimizedBuffer.length,
          },
          storage: {
            key,
            url: uploadResult.Location!,
          },
          createdAt: new Date(),
        });
      }
    }

    return variants;
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export const mediaAttachmentService = new MediaAttachmentService();
