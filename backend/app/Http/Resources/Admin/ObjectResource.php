<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ObjectResource extends JsonResource
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
            'description' => $this->description,
            'status' => $this->status,
            'has_token' => ! empty($this->public_token_hash),
            'published_at' => $this->published_at?->toISOString(),
            'panoramas_count' => $this->panoramas_count ?? $this->panoramas()->count(),
            'panoramas' => PanoramaResource::collection($this->whenLoaded('panoramas')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
