<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Annotation extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'annotations';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'panorama_id',
        'type',
        'template_key',
        'position',
        'content',
        'style',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'array',
            'content' => 'array',
            'style' => 'array',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the parent panorama.
     */
    public function panorama(): BelongsTo
    {
        return $this->belongsTo(Panorama::class, 'panorama_id');
    }
}

