<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Panorama extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'panoramas';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'object_id',
        'title',
        'image_path',
        'image_mime_type',
        'image_size',
        'width',
        'height',
        'sort_order',
        'status',
        'viewer_type',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'image_size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the parent object.
     */
    public function object(): BelongsTo
    {
        return $this->belongsTo(PanoramaObject::class, 'object_id');
    }

    /**
     * Get the annotations for this panorama.
     */
    public function annotations(): HasMany
    {
        return $this->hasMany(Annotation::class, 'panorama_id')->orderBy('sort_order');
    }

    /**
     * Get the public URL for the panorama image.
     */
    public function getImageUrlAttribute(): string
    {
        return '/storage/' . ltrim($this->image_path, '/');
    }
}

