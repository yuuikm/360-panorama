<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicPanoramaResource extends JsonResource
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
            'title' => $this->title,
            'image_url' => $this->image_url,
            'width' => $this->width,
            'height' => $this->height,
            'sort_order' => $this->sort_order,
            'viewer_type' => $this->viewer_type ?? 'flat',
            'annotations' => PublicAnnotationResource::collection($this->whenLoaded('annotations')),
        ];
    }
}

