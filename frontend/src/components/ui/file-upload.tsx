import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, Video, File } from 'lucide-react'
import { Button } from './button'
import { Progress } from './progress'
import { cn } from '@/lib/utils'

interface UploadedFile {
  name: string
  size: number
  type: string
  url: string
  extractedText?: string
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  className?: string
  title?: string
  description?: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-6 h-6" />
  if (type.startsWith('video/')) return <Video className="w-6 h-6" />
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) 
    return <FileText className="w-6 h-6" />
  return <File className="w-6 h-6" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 50, // 50MB
  className,
  title = "Upload Files",
  description = "Drag and drop files here, or click to select"
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadToS3 = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'startup-asset')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      url: result.url,
      extractedText: result.extractedText
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = acceptedFiles.length
      const newFiles: UploadedFile[] = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`)
          continue
        }

        try {
          const uploadedFile = await uploadToS3(file)
          newFiles.push(uploadedFile)
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          alert(`Failed to upload ${file.name}`)
        }

        setUploadProgress(((i + 1) / totalFiles) * 100)
      }

      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      onFilesUploaded(allFiles)

    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [uploadedFiles, maxFiles, maxFileSize, onFilesUploaded])

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFilesUploaded(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploading || uploadedFiles.length >= maxFiles
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          (uploading || uploadedFiles.length >= maxFiles) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <p className="text-xs text-gray-500">
          Max {maxFiles} files, up to {maxFileSize}MB each
        </p>
        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files ({uploadedFiles.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mr-3 text-gray-500">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {file.extractedText && (
                    <p className="text-xs text-green-600 mt-1">✓ Text extracted successfully</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
