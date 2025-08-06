import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FileUpload } from '../ui/file-upload'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Plus, Trash2, Link } from 'lucide-react'
import { CompleteIntake } from '@/lib/validations/intake'

interface UploadedFile {
  name: string
  size: number
  type: string
  url: string
  extractedText?: string
}

export function StepAssets() {
  const { setValue, watch, formState: { errors } } = useFormContext<CompleteIntake>()
  const blogLinks = watch('assets.blog_links') || []

  const addBlogLink = () => {
    setValue('assets.blog_links', [...blogLinks, ''])
  }

  const updateBlogLink = (index: number, value: string) => {
    const newLinks = [...blogLinks]
    newLinks[index] = value
    setValue('assets.blog_links', newLinks)
  }

  const removeBlogLink = (index: number) => {
    setValue('assets.blog_links', blogLinks.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Assets & Resources</h2>
        <p className="text-gray-600">Upload your marketing materials and provide relevant links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-medium">Logo</Label>
            <p className="text-sm text-gray-600">Upload your company logo in high resolution</p>
          </div>
          <FileUpload
            onFilesUploaded={(files: UploadedFile[]) => setValue('assets.logo', files)}
            maxFiles={3}
            acceptedTypes={['image/*']}
            maxFileSize={10}
            title="Upload Logo"
            description="PNG, JPG, SVG up to 10MB"
          />
        </div>

        {/* Screenshots */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-medium">Product Screenshots</Label>
            <p className="text-sm text-gray-600">Upload screenshots of your product or interface</p>
          </div>
          <FileUpload
            onFilesUploaded={(files: UploadedFile[]) => setValue('assets.screenshots', files)}
            maxFiles={10}
            acceptedTypes={['image/*']}
            maxFileSize={10}
            title="Upload Screenshots"
            description="PNG, JPG up to 10MB each"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demo Videos */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-medium">Demo Videos</Label>
            <p className="text-sm text-gray-600">Upload product demo videos or explainer videos</p>
          </div>
          <FileUpload
            onFilesUploaded={(files: UploadedFile[]) => setValue('assets.demo_videos', files)}
            maxFiles={5}
            acceptedTypes={['video/*']}
            maxFileSize={100}
            title="Upload Demo Videos"
            description="MP4, MOV up to 100MB each"
          />
        </div>

        {/* Case Studies */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-medium">Case Studies</Label>
            <p className="text-sm text-gray-600">Upload customer case studies or success stories</p>
          </div>
          <FileUpload
            onFilesUploaded={(files: UploadedFile[]) => setValue('assets.case_studies', files)}
            maxFiles={10}
            acceptedTypes={['.pdf', '.doc', '.docx', 'image/*']}
            maxFileSize={25}
            title="Upload Case Studies"
            description="PDF, DOC, DOCX, Images up to 25MB"
          />
        </div>
      </div>

      {/* Pitch Deck */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Pitch Deck</Label>
          <p className="text-sm text-gray-600">Upload your pitch deck or investor presentation (optional but helpful for content extraction)</p>
        </div>
        <FileUpload
          onFilesUploaded={(files: UploadedFile[]) => setValue('assets.pitch_deck', files)}
          maxFiles={3}
          acceptedTypes={['.pdf', '.ppt', '.pptx']}
          maxFileSize={50}
          title="Upload Pitch Deck"
          description="PDF, PPT, PPTX up to 50MB"
        />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>AI Enhancement:</strong> We'll automatically extract key information from your pitch deck 
            to help generate more targeted content and messaging.
          </p>
        </div>
      </div>

      {/* Blog Links */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Blog Links</Label>
          <p className="text-sm text-gray-600">Add links to your existing blog posts or content</p>
        </div>
        
        <div className="space-y-3">
          {blogLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Link className="w-4 h-4 text-gray-400" />
                <Input
                  value={link}
                  onChange={(e) => updateBlogLink(index, e.target.value)}
                  placeholder="https://your-blog.com/post-title"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeBlogLink(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addBlogLink}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Blog Link
          </Button>
          
          {errors.assets?.blog_links && (
            <p className="text-sm text-red-600">{errors.assets.blog_links.message}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium mb-2">What happens with your files?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Files are securely uploaded to AWS S3 with encryption</li>
          <li>• Text content is extracted from documents using AI</li>
          <li>• Extracted information helps generate personalized content</li>
          <li>• All files remain private to your account</li>
          <li>• You can delete files at any time from your dashboard</li>
        </ul>
      </div>
    </div>
  )
}
