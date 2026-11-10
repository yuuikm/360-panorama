<?php

namespace App\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class QrCodeService
{
    /**
     * Generate an SVG string representing the QR code for a given URL or text.
     */
    public function generateSvg(string $content, int $size = 256): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, 1),
            new SvgImageBackEnd
        );
        $writer = new Writer($renderer);

        return $writer->writeString($content);
    }

    /**
     * Generate a Base64 Data URI for inline display in images or frontend components.
     */
    public function generateDataUri(string $content, int $size = 256): string
    {
        $svg = $this->generateSvg($content, $size);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
