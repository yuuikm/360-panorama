<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PanoramaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'object_id' => $this->object_id,
            'title' => $this->title,
            'image_path' => $this->image_path,
            'image_url' => $this->image_url,
            'image_mime_type' => $this->image_mime_type,
            'image_size' => $this->image_size,
            'width' => $this->width,
            'height' => $this->height,
            'sort_order' => $this->sort_order,
            'status' => $this->status,
            'viewer_type' => $this->viewer_type ?? 'flat',
            'annotations_count' => $this->annotations_count ?? $this->annotations()->count(),
            'annotations' => AnnotationResource::collection($this->whenLoaded('annotations')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

