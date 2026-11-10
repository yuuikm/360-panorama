<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'required', 'string', 'in:label,measurement,callout,marker'],
            'template_key' => ['sometimes', 'required', 'string', 'max:64'],
            'position' => ['sometimes', 'required', 'array'],
            'position.x' => ['nullable', 'numeric', 'between:0,100'],
            'position.y' => ['nullable', 'numeric', 'between:0,100'],
            'position.x2' => ['nullable', 'numeric', 'between:0,100'],
            'position.y2' => ['nullable', 'numeric', 'between:0,100'],
            'position.yaw' => ['nullable', 'numeric', 'between:-360,360'],
            'position.pitch' => ['nullable', 'numeric', 'between:-90,90'],
            'content' => ['sometimes', 'required', 'array'],
            'style' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
