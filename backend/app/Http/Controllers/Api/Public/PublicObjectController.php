<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Public\PublicObjectResource;
use App\Models\PanoramaObject;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicObjectController extends Controller
{
    /**
     * Display a published object by its secure public token.
     */
    public function show(Request $request, string $publicToken): PublicObjectResource
    {
        $hash = hash('sha256', $publicToken);

        $object = PanoramaObject::where('public_token_hash', $hash)
            ->where('status', 'published')
            ->with([
                'panoramas' => function ($query) {
                    $query->where('status', 'ready')
                        ->orderBy('sort_order')
                        ->with(['annotations' => function ($q) {
                            $q->orderBy('sort_order');
                        }]);
                },
            ])
            ->first();

        if (! $object) {
            throw new NotFoundHttpException('Object not found or no longer available');
        }

        return new PublicObjectResource($object);
    }
}
