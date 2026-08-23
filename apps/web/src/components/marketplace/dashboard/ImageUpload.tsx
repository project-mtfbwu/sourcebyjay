'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/supabase-clients/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = 'products' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sign in to upload images');
        return;
      }

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      onChange(publicUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative inline-block">
          <div className="relative size-32 overflow-hidden rounded-lg border">
            <Image src={value} alt="Upload preview" fill className="object-cover" sizes="128px" />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground hover:border-brand-primary hover:text-foreground"
        >
          <Upload className="size-6" />
          {uploading ? 'Uploading...' : 'Upload image'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
        }}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {value ? 'Replace' : 'Choose file'}
        </Button>
        <span className="self-center text-xs text-muted-foreground">or paste URL below</span>
      </div>
    </div>
  );
}
