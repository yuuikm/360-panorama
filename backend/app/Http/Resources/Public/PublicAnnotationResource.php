<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicAnnotationResource extends JsonResource
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
            'type' => $this->type,
            'template_key' => $this->template_key,
            'position' => $this->position,
            'content' => $this->content,
            'style' => $this->style ?? (object) [],
            'sort_order' => $this->sort_order,
        ];
    }
}
