<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePanoramaRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'image' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,webp',
                'max:51200',
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,ready'],
            'viewer_type' => ['sometimes', 'nullable', 'string', 'in:flat,360'],
        ];
    }
}
