<?php
/**
 * Robotree Robotics LLP - Enterprise FPDF Certificate Engine
 *
 * Extends standard FPDF with official extensions & high-security vector primitives:
 *  - RoundedRect (Script 23): Smooth rounded corners with individual corner control
 *  - SetDash (Script 21): Vector dashed and dotted lines
 *  - Rotate (Script 2): Arbitrary angle coordinate transformations
 *  - SetAlpha (Script 74): Alpha channel transparency for watermarks
 *  - LinearGradient (Script 66): Vector gradient shading
 *  - FitTextCell: Dynamic font auto-scaling to prevent text overflow
 *  - DrawGuillocheWave: Mathematical anti-tampering wave patterns
 *  - DrawRosetteSeal: 32-point gold rosette accreditation foil seal
 *  - DrawVectorQRCodeMatrix: Pure PHP vector QR matrix plotter
 *
 * Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity).
 */

require_once __DIR__ . '/fpdf/fpdf.php';

class FPDFCertificate extends FPDF {
    protected bool $_dashed = false;
    protected array $_extGStates = [];
    protected float $_angle = 0;
    protected bool $_enablePageBreak = false;
    protected array $_registeredFonts = [];

    public function __construct(string $orientation = 'L', string $unit = 'mm', string $size = 'A4') {
        parent::__construct($orientation, $unit, $size);
        $this->SetAutoPageBreak(false);
    }

    public function setAllowMultiPage(bool $allow): void {
        $this->_enablePageBreak = $allow;
    }

    /**
     * FPDF Lifecycle Hook: AcceptPageBreak()
     * Prevents accidental single-page overflows while enabling structured multi-page transcripts.
     */
    public function AcceptPageBreak(): bool {
        return $this->_enablePageBreak;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. EXTENSION: RoundedRect (Script 23 by Christophe Prugnaud)
    // ──────────────────────────────────────────────────────────────────────────
    public function RoundedRect($x, $y, $w, $h, $r, $corners = '1234', $style = ''): void {
        $k = $this->k;
        $hp = $this->h;
        if ($style === 'F') {
            $op = 'f';
        } elseif ($style === 'FD' || $style === 'DF') {
            $op = 'B';
        } else {
            $op = 'S';
        }

        $MyArc = 4/3 * (sqrt(2) - 1);
        $this->_out(sprintf('%.2F %.2F m', ($x + $r) * $k, ($hp - $y) * $k));

        $xc = $x + $w - $r;
        $yc = $y + $r;
        $this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - $y) * $k));
        if (strpos($corners, '2') === false) {
            $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - $y) * $k));
        } else {
            $this->_Arc($xc + $r * $MyArc, $yc - $r, $xc + $r, $yc - $r * $MyArc, $xc + $r, $yc);
        }

        $xc = $x + $w - $r;
        $yc = $y + $h - $r;
        $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - $yc) * $k));
        if (strpos($corners, '3') === false) {
            $this->_out(sprintf('%.2F %.2F l', ($x + $w) * $k, ($hp - ($y + $h)) * $k));
        } else {
            $this->_Arc($xc + $r, $yc + $r * $MyArc, $xc + $r * $MyArc, $yc + $r, $xc, $yc + $r);
        }

        $xc = $x + $r;
        $yc = $y + $h - $r;
        $this->_out(sprintf('%.2F %.2F l', $xc * $k, ($hp - ($y + $h)) * $k));
        if (strpos($corners, '4') === false) {
            $this->_out(sprintf('%.2F %.2F l', $x * $k, ($hp - ($y + $h)) * $k));
        } else {
            $this->_Arc($xc - $r * $MyArc, $yc + $r, $xc - $r, $yc + $r * $MyArc, $xc - $r, $yc);
        }

        $xc = $x + $r;
        $yc = $y + $r;
        $this->_out(sprintf('%.2F %.2F l', $x * $k, ($hp - $yc) * $k));
        if (strpos($corners, '1') === false) {
            $this->_out(sprintf('%.2F %.2F l', $x * $k, ($hp - $y) * $k));
            $this->_out(sprintf('%.2F %.2F l', ($x + $r) * $k, ($hp - $y) * $k));
        } else {
            $this->_Arc($xc - $r, $yc - $r * $MyArc, $xc - $r * $MyArc, $yc - $r, $xc, $yc - $r);
        }

        $this->_out($op);
    }

    protected function _Arc($x1, $y1, $x2, $y2, $x3, $y3): void {
        $h = $this->h;
        $this->_out(sprintf('%.2F %.2F %.2F %.2F %.2F %.2F c ', 
            $x1 * $this->k, ($h - $y1) * $this->k, 
            $x2 * $this->k, ($h - $y2) * $this->k, 
            $x3 * $this->k, ($h - $y3) * $this->k));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. EXTENSION: SetDash (Script 21 by Olivier)
    // ──────────────────────────────────────────────────────────────────────────
    public function SetDash(?float $black = null, ?float $white = null): void {
        if ($black !== null && $white !== null) {
            $s = sprintf('[%.3F %.3F] 0 d', $black * $this->k, $white * $this->k);
        } else {
            $s = '[] 0 d';
        }
        $this->_out($s);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. EXTENSION: Rotation (Script 2 by Olivier)
    // ──────────────────────────────────────────────────────────────────────────
    public function Rotate(float $angle, float $x = -1, float $y = -1): void {
        if ($x === -1.0) $x = $this->x;
        if ($y === -1.0) $y = $this->y;
        if ($this->_angle !== 0.0) $this->_out('Q');
        $this->_angle = $angle;
        if ($angle !== 0.0) {
            $rad = $angle * M_PI / 180;
            $c = cos($rad);
            $s = sin($rad);
            $cx = $x * $this->k;
            $cy = ($this->h - $y) * $this->k;
            $this->_out(sprintf('q %.5F %.5F %.5F %.5F %.5F %.5F cm 1 0 0 1 %.5F %.5F cm', $c, $s, -$s, $c, $cx, $cy, -$cx, -$cy));
        }
    }

    public function _endpage(): void {
        if ($this->_angle !== 0.0) {
            $this->_angle = 0.0;
            $this->_out('Q');
        }
        parent::_endpage();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. EXTENSION: Transparency / Alpha Channel (Script 74)
    // ──────────────────────────────────────────────────────────────────────────
    public function SetAlpha(float $alpha, string $bm = 'Normal'): void {
        $gs = $this->AddExtGState(['ca' => $alpha, 'CA' => $alpha, 'BM' => '/' . $bm]);
        $this->SetExtGState($gs);
    }

    protected function AddExtGState(array $parms): int {
        $n = count($this->_extGStates) + 1;
        $this->_extGStates[$n]['parms'] = $parms;
        return $n;
    }

    protected function SetExtGState(int $gs): void {
        $this->_out(sprintf('/GS%d gs', $gs));
    }

    protected function _putextgstates(): void {
        for ($i = 1; $i <= count($this->_extGStates); $i++) {
            $this->_newobj();
            $this->_extGStates[$i]['n'] = $this->n;
            $this->_out('<</Type /ExtGState');
            $parms = $this->_extGStates[$i]['parms'];
            $this->_out(sprintf('/ca %.3F', $parms['ca']));
            $this->_out(sprintf('/CA %.3F', $parms['CA']));
            $this->_out(sprintf('/BM %s', $parms['BM']));
            $this->_out('>>');
            $this->_out('endobj');
        }
    }

    protected function _putresourcedict(): void {
        parent::_putresourcedict();
        $this->_out('/ExtGState <<');
        foreach ($this->_extGStates as $k => $extGState) {
            $this->_out('/GS' . $k . ' ' . $extGState['n'] . ' 0 R');
        }
        $this->_out('>>');
    }

    protected function _putresources(): void {
        $this->_putextgstates();
        parent::_putresources();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. EXTENSION: Linear Gradient Shading (Script 66)
    // ──────────────────────────────────────────────────────────────────────────
    public function LinearGradient(float $x, float $y, float $w, float $h, array $col1, array $col2): void {
        $steps = 60;
        $r1 = $col1[0]; $g1 = $col1[1]; $b1 = $col1[2];
        $r2 = $col2[0]; $g2 = $col2[1]; $b2 = $col2[2];
        $step_h = $h / $steps;

        for ($i = 0; $i < $steps; $i++) {
            $ratio = $i / ($steps - 1);
            $r = (int)($r1 + ($r2 - $r1) * $ratio);
            $g = (int)($g1 + ($g2 - $g1) * $ratio);
            $b = (int)($b1 + ($b2 - $b1) * $ratio);
            $this->SetFillColor($r, $g, $b);
            $this->Rect($x, $y + ($i * $step_h), $w, $step_h + 0.1, 'F');
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. DYNAMIC FONT AUTO-FITTING
    // ──────────────────────────────────────────────────────────────────────────
    public function FitTextCell(string $text, float $maxWidth, float $maxFontSize, float $minFontSize = 14, string $fontFamily = 'Helvetica', string $fontStyle = 'B'): float {
        $size = $maxFontSize;
        $this->SetFont($fontFamily, $fontStyle, $size);
        while ($this->GetStringWidth($text) > $maxWidth && $size > $minFontSize) {
            $size -= 0.5;
            $this->SetFont($fontFamily, $fontStyle, $size);
        }
        return $size;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. SECURITY: Mathematical Guilloche Anti-Tampering Pattern
    // ──────────────────────────────────────────────────────────────────────────
    public function DrawGuillocheWave(float $cx, float $cy, float $radius, int $waves = 16, float $amplitude = 2.5, int $loops = 1): void {
        $this->SetLineWidth(0.12);
        $totalPoints = 360 * $loops;
        $prevX = null; $prevY = null;

        for ($angle = 0; $angle <= $totalPoints; $angle += 2) {
            $rad = deg2rad($angle);
            $r = $radius + sin($rad * $waves) * $amplitude;
            $px = $cx + $r * cos($rad);
            $py = $cy + $r * sin($rad);

            if ($prevX !== null) {
                $this->Line($prevX, $prevY, $px, $py);
            }
            $prevX = $px;
            $prevY = $py;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. SECURITY: 32-Point Gold Rosette Foil Seal
    // ──────────────────────────────────────────────────────────────────────────
    public function DrawRosetteSeal(float $cx, float $cy, float $radius = 18): void {
        $points = 32;
        $rInner = $radius * 0.90;
        $rOuter = $radius;

        $this->SetFillColor(212, 175, 55); // Metallic Gold #d4af37
        $this->SetDrawColor(180, 140, 30);
        $this->SetLineWidth(0.2);

        $coords = [];
        for ($i = 0; $i < $points * 2; $i++) {
            $r = ($i % 2 === 0) ? $rOuter : $rInner;
            $angle = deg2rad($i * (360 / ($points * 2)));
            $coords[] = $cx + $r * cos($angle);
            $coords[] = $cy + $r * sin($angle);
        }

        $this->_out('q');
        $k = $this->k;
        $hp = $this->h;
        $this->_out(sprintf('%.2F %.2F m', $coords[0] * $k, ($hp - $coords[1]) * $k));
        for ($i = 2; $i < count($coords); $i += 2) {
            $this->_out(sprintf('%.2F %.2F l', $coords[$i] * $k, ($hp - $coords[$i + 1]) * $k));
        }
        $this->_out('b');
        $this->_out('Q');

        // Embossed concentric rings
        $this->SetDrawColor(255, 235, 150);
        $this->SetLineWidth(0.4);
        $this->Circle($cx, $cy, $radius * 0.82);

        $this->SetDrawColor(150, 110, 20);
        $this->SetLineWidth(0.25);
        $this->Circle($cx, $cy, $radius * 0.77);

        // Core background
        $this->SetFillColor(230, 190, 60);
        $this->Circle($cx, $cy, $radius * 0.75, 'F');

        // Guilloche micro-waves
        $this->SetDrawColor(180, 130, 20);
        $this->DrawGuillocheWave($cx, $cy, $radius * 0.55, 12, 1.2);

        // Seal center text
        $this->SetTextColor(0, 43, 102); // Robotree Brand Navy
        $this->SetFont('Helvetica', 'B', 5.5);
        $this->SetXY($cx - $radius, $cy - 4.5);
        $this->Cell($radius * 2, 3, 'ROBOTREE', 0, 1, 'C');
        $this->SetFont('Helvetica', 'B', 4.5);
        $this->SetXY($cx - $radius, $cy - 1);
        $this->Cell($radius * 2, 3, 'OFFICIAL SEAL', 0, 1, 'C');
        $this->SetFont('Helvetica', '', 3.8);
        $this->SetXY($cx - $radius, $cy + 2.5);
        $this->Cell($radius * 2, 2.5, 'ISO 9001:2015', 0, 1, 'C');
    }

    public function Circle(float $x, float $y, float $r, string $style = 'D'): void {
        $this->Ellipse($x, $y, $r, $r, $style);
    }

    public function Ellipse(float $x, float $y, float $rx, float $ry, string $style = 'D'): void {
        if ($style === 'F') $op = 'f';
        elseif ($style === 'FD' || $style === 'DF') $op = 'B';
        else $op = 'S';

        $lx = 4/3 * (sqrt(2) - 1) * $rx;
        $ly = 4/3 * (sqrt(2) - 1) * $ry;
        $k = $this->k;
        $h = $this->h;
        $this->_out(sprintf('%.2F %.2F m %.2F %.2F %.2F %.2F %.2F %.2F c',
            ($x+$rx)*$k, ($h-$y)*$k,
            ($x+$rx)*$k, ($h-($y-$ly))*$k,
            ($x+$lx)*$k, ($h-($y-$ry))*$k,
            $x*$k, ($h-($y-$ry))*$k));
        $this->_out(sprintf('%.2F %.2F m %.2F %.2F %.2F %.2F %.2F %.2F c',
            ($x-$lx)*$k, ($h-($y-$ry))*$k,
            ($x-$rx)*$k, ($h-($y-$ly))*$k,
            ($x-$rx)*$k, ($h-$y)*$k));
        $this->_out(sprintf('%.2F %.2F m %.2F %.2F %.2F %.2F %.2F %.2F c',
            ($x-$rx)*$k, ($h-($y+$ly))*$k,
            ($x-$lx)*$k, ($h-($y+$ry))*$k,
            $x*$k, ($h-($y+$ry))*$k));
        $this->_out(sprintf('%.2F %.2F m %.2F %.2F %.2F %.2F %.2F %.2F c %s',
            ($x+$lx)*$k, ($h-($y+$ry))*$k,
            ($x+$rx)*$k, ($h-($y+$ly))*$k,
            ($x+$rx)*$k, ($h-$y)*$k,
            $op));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. QR CODE: Vector Matrix Plotter
    // ──────────────────────────────────────────────────────────────────────────
    public function DrawVectorQRCodeMatrix(array $matrix, float $x, float $y, float $size = 22): void {
        $moduleCount = count($matrix);
        if ($moduleCount === 0) return;
        $moduleSize = $size / $moduleCount;

        $this->SetFillColor(0, 43, 102);
        for ($r = 0; $r < $moduleCount; $r++) {
            for ($c = 0; $c < $moduleCount; $c++) {
                if ($matrix[$r][$c]) {
                    $this->Rect($x + ($c * $moduleSize), $y + ($r * $moduleSize), $moduleSize, $moduleSize, 'F');
                }
            }
        }
    }
}
