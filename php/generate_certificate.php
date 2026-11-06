<?php
/**
 * Robotree Robotics LLP - Enterprise Certificate Generator (FPDF Engine)
 *
 * Generates authentic, high-resolution "Certificate of Participation & Accreditation"
 * PDF documents using FPDF with advanced page layout controls, custom font support,
 * multi-page transcript options, and Government of India protocol accreditation.
 *
 * Key FPDF Features Utilized:
 *  - AddPage($orientation, $size, $rotation): Supports Landscape ('L') and Portrait ('P') on A4 / Letter.
 *  - AddFont($family, $style, $file): Custom font registration with graceful core-font fallback.
 *  - AcceptPageBreak(): Custom page-break handler preventing accidental overflows and orchestrating multi-page transcripts.
 *  - SetDash($black, $white): Hardware PDF vector graphic line-dashing operator.
 *
 * Usage (Web):
 *   GET /php/generate_certificate.php?name=Arjun+Sharma&course=Robotics+Workshop&orientation=L&pages=1&output=I
 *
 * Usage (CLI):
 *   php php/generate_certificate.php --name="Arjun Sharma" --course="Robotics Workshop" --orientation=L --output=F
 */

require_once __DIR__ . '/fpdf/fpdf.php';
require_once __DIR__ . '/FPDFCertificate.php';

// ─── Environment & Font Directory Configuration ──────────────────────────────
if (!defined('FPDF_FONTPATH')) {
    define('FPDF_FONTPATH', __DIR__ . '/fonts/');
}

// ─── Parameter Parsing Helpers ────────────────────────────────────────────────
function param(string $key, string $default = ''): string {
    if (PHP_SAPI === 'cli') {
        global $argv;
        if (isset($argv) && is_array($argv)) {
            foreach ($argv as $arg) {
                if (preg_match('/^--' . preg_quote($key, '/') . '=(.*)$/i', $arg, $m)) {
                    return trim($m[1], '"\' . "');
                }
            }
        }
        return $default;
    }
    $v = $_GET[$key] ?? $_POST[$key] ?? $default;
    return htmlspecialchars_decode(strip_tags((string)$v), ENT_QUOTES);
}

function generateCertId(string $name, string $prefix = 'RRT'): string {
    $initials = '';
    foreach (explode(' ', strtoupper($name)) as $w) {
        if ($w !== '') {
            $initials .= $w[0];
        }
    }
    if (strlen($initials) < 2) {
        $initials = str_pad($initials, 2, 'X');
    }
    $datePart = date('Y') . '-' . date('md');
    $hashPart = strtoupper(substr(hash('sha256', $name . time() . 'ROBOTREE_SALT'), 0, 4));
    return $prefix . '-' . $datePart . '-' . strtoupper(substr($initials, 0, 3)) . '-' . $hashPart;
}

// ─── Input Parameters ─────────────────────────────────────────────────────────
$studentName  = param('name',        'Participant Name');
$courseTitle  = param('course',      'Autonomous Robotics & AI Engineering');
$classGroup   = param('class',       'Scholars & Engineering Candidates');
$issueDate    = param('date',        date('jS F Y'));
$eventTime    = param('time',        '11:00 AM TO 1:00 PM');
$venue        = param('venue',       'Robotree Asansol Centre of Excellence');
$venueDetail  = param('venue2',      '(Sentrum Mall, 3rd Floor, Shristinagar)');
$orientation  = strtoupper(param('orientation', 'L')); // 'L' (Landscape) or 'P' (Portrait)
$pageSize     = strtoupper(param('size', 'A4'));       // 'A4' or 'LETTER'
$pageMode     = (int)param('pages', '1');              // 1 = Certificate only, 2 = Certificate + Transcript
$styleTheme   = strtolower(param('theme', 'classic')); // 'classic' or 'cyber'
$designTemplate = strtolower(param('template', 'official')); // 'official' (Original template) or 'vector'
$outputMode   = strtoupper(param('output', 'I'));      // I=inline, D=download, S=string/base64, F=file
$outputFile   = param('file', '');
$certId       = param('cert_id', generateCertId($studentName));

// Validate orientation
if ($orientation !== 'P' && $orientation !== 'L') {
    $orientation = 'L';
}

// ─── Color Palette ────────────────────────────────────────────────────────────
define('CLR_NAVY',     [0,   43,  102]);   // Deep Robotree Blue
define('CLR_NAVY_DARK',[3,   11,  19]);    // Space Deep Navy
define('CLR_GREEN',    [0,   128,  60]);   // Emerald Accent
define('CLR_CYBER',    [120, 216,  68]);   // Cyber Neon Green
define('CLR_GOLD',     [212, 175,  55]);   // Executive Gold Accent
define('CLR_WHITE',    [255, 255, 255]);
define('CLR_LIGHT',    [244, 248, 255]);   // Light surface
define('CLR_MUTED',    [100, 116, 139]);   // Secondary text
define('CLR_BORDER',   [183, 209, 229]);

// ─── Enhanced RobotreeCertificate Class ───────────────────────────────────────
class RobotreeCertificate extends FPDFCertificate {
    private string $activeTheme = 'classic';
    private string $certOrientation = 'L';
    private string $certId = '';
    private string $recipientName = '';

    public function __construct(string $orientation = 'L', string $size = 'A4', string $theme = 'classic') {
        parent::__construct($orientation, 'mm', $size);
        $this->certOrientation = $orientation;
        $this->activeTheme = $theme;
    }

    public function setCertificateMeta(string $id, string $name): void {
        $this->certId = $id;
        $this->recipientName = $name;
    }

    /**
     * Safe Font Loader using FPDF AddFont()
     * Attempts to register a custom font definition file if present,
     * otherwise falls back smoothly to core standard fonts.
     */
    public function SafeAddFont(string $family, string $style = '', string $file = ''): bool {
        $fontKey = strtolower($family . $style);
        if (isset($this->_registeredFonts[$fontKey])) {
            return true;
        }

        $fontDir = defined('FPDF_FONTPATH') ? FPDF_FONTPATH : __DIR__ . '/fonts/';
        $targetFile = $file !== '' ? $file : strtolower($family . $style) . '.php';

        if (file_exists($fontDir . $targetFile) || file_exists($targetFile)) {
            try {
                $this->AddFont($family, $style, $targetFile);
                $this->_registeredFonts[$fontKey] = true;
                return true;
            } catch (Exception $e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Safe font setter that falls back if a custom font has not been added
     */
    public function SafeSetFont(string $family, string $style = '', float $size = 0, string $fallback = 'helvetica'): void {
        $fontKey = strtolower($family . $style);
        $coreFonts = ['helvetica', 'arial', 'times', 'courier', 'symbol', 'zapfdingbats'];

        if (in_array(strtolower($family), $coreFonts) || isset($this->_registeredFonts[$fontKey])) {
            $this->SetFont($family, $style, $size);
        } else {
            $this->SetFont($fallback, $style, $size);
        }
    }

    /**
     * Government Protocol Accreditation Badge
     */
    public function DrawGovernmentProtocolBadge(float $x, float $y, float $w): void {
        $this->SetFillColor(240, 245, 238);
        $this->SetDrawColor(...CLR_GOLD);
        $this->SetLineWidth(0.3);
        $this->RoundedRect($x, $y, $w, 8, 2, '1234', 'DF');

        $this->SetFont('helvetica', 'B', 7);
        $this->SetTextColor(...CLR_NAVY);
        $this->SetXY($x, $y + 1);
        $this->Cell($w, 3.5, 'GOVERNMENT OF INDIA ACCREDITED ENTITY', '', 1, 'C');
        $this->SetFont('helvetica', '', 6);
        $this->SetTextColor(70, 90, 60);
        $this->SetXY($x, $y + 4.5);
        $this->Cell($w, 3, 'Registered under GeM & MSME Protocols | ISO 9001:2015 Certified', '', 0, 'C');
    }
}

// ─── Initialize PDF Generator ────────────────────────────────────────────────
$pdf = new RobotreeCertificate($orientation, $pageSize, $styleTheme);
$pdf->setCertificateMeta($certId, $studentName);
$pdf->SetMargins(0, 0, 0);

// Try to register custom web fonts if available in fonts/ directory
$pdf->SafeAddFont('Cinzel', '', 'cinzel.php');
$pdf->SafeAddFont('Montserrat', '', 'montserrat.php');
$pdf->SafeAddFont('Roboto', '', 'roboto.php');

// Call AddPage() with dynamic orientation and size
$pdf->AddPage($orientation, $pageSize);

$W = $pdf->GetPageWidth();
$H = $pdf->GetPageHeight();

// Check if Official Graphic Template is requested and available
$officialTemplateCandidates = [
    __DIR__ . '/assets/certificate_template.jpg',
    dirname(__DIR__) . '/assets/certificate_template.jpg',
    dirname(__DIR__) . '/certificate-generator/public/certificate.jpeg',
    dirname(__DIR__) . '/certificate-generator/public/certificate.png',
];

$bgImg = null;
foreach ($officialTemplateCandidates as $candidatePath) {
    if (file_exists($candidatePath)) {
        $bgImg = $candidatePath;
        break;
    }
}

$useGraphicTemplate = ($designTemplate === 'official' && ($orientation === 'L') && ($bgImg !== null));

// ─── PAGE 1: OFFICIAL ACCREDITED CERTIFICATE ──────────────────────────────────

if ($useGraphicTemplate) {
    // ─── MODE A: HIGH-RESOLUTION OFFICIAL GRAPHIC TEMPLATE UNDERLAY ───────────
    $pdf->Image($bgImg, 0, 0, $W, $H);

    // Dynamic Student Name Overlay (sits cleanly above the dotted line)
    // On 297x210 mm A4 landscape, dotted line is at Y = 90.5 mm
    $nameBoxW = $W - 70;
    $fontSize = $pdf->FitTextCell(strtoupper($studentName), $nameBoxW, 26, 16, 'times', 'B');
    $pdf->SetFont('times', 'B', $fontSize);
    $pdf->SetTextColor(10, 31, 51); // Deep Navy
    $nameY = 76.5; // Top of cell at 76.5, height 13.0 -> baseline rests naturally above dotted line (90.5mm)
    $pdf->SetXY(35, $nameY);
    $pdf->Cell($nameBoxW, 13.0, strtoupper($studentName), 0, 1, 'C');

    // Reference ID in the official bottom card
    // In template: Reference ID placeholder is inside white card (Y ~ 192mm, X ~ 160mm)
    $refBoxX = 160.0;
    $refBoxY = 191.8;
    $refBoxW = 56.0;
    $refBoxH = 5.8;
    $pdf->SetFillColor(245, 248, 248); // Perfectly matches the card background
    $pdf->Rect($refBoxX, $refBoxY, $refBoxW, $refBoxH, 'F');
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetTextColor(10, 31, 51);
    $pdf->SetXY($refBoxX, $refBoxY);
    $pdf->Cell($refBoxW, $refBoxH, $certId, 0, 0, 'C');

    // Authentic Mentor & Director Signatures
    $pdf->SetFont('times', 'I', 13);
    $pdf->SetTextColor(10, 31, 51);
    // Mentor signature: Rishav Maji above MENTOR (X center ~ 97mm)
    $pdf->SetXY(72, 165.5);
    $pdf->Cell(50, 6, 'Rishav Maji', 0, 0, 'C');
    // Director signature: Rahul Kr. Ghosh above DIRECTOR (X center ~ 193mm)
    $pdf->SetXY(168, 165.5);
    $pdf->Cell(50, 6, 'Rahul Kr. Ghosh', 0, 0, 'C');
} else {
    // ─── MODE B: 100% MATHEMATICAL VECTOR GUILLOCHE & ROSETTE MASTER ──────────
    // 1. Base Canvas Surface
    $pdf->SetFillColor(...CLR_WHITE);
    $pdf->Rect(0, 0, $W, $H, 'F');

    // 2. High-Tech Frame Bars
    $barHeight = ($orientation === 'L') ? 10 : 12;
    $pdf->SetFillColor(...CLR_NAVY);
    $pdf->Rect(0, 0, $W, $barHeight, 'F');
    $pdf->Rect(0, $H - $barHeight + 2, $W, $barHeight - 2, 'F');

    // Left and Right Navy Structural Pillars
    $pillarW = ($orientation === 'L') ? 12 : 10;
    $pdf->Rect(0, 0, $pillarW, $H, 'F');
    $pdf->Rect($W - $pillarW, 0, $pillarW, $H, 'F');

    // Diagonal Emerald Brand Flairs
    $pdf->SetFillColor(...CLR_GREEN);
    $pdf->Rect(0, 0, ($orientation === 'L' ? 60 : 45), $barHeight, 'F');
    $pdf->Rect($pillarW, 0, 24, $barHeight + 8, 'F');
    $pdf->Rect($W - ($orientation === 'L' ? 60 : 45), 0, ($orientation === 'L' ? 60 : 45), $barHeight, 'F');
    $pdf->Rect($W - $pillarW - 24, 0, 24, $barHeight + 8, 'F');

    // 3. Double Gold Decorative Geometric Inner Borders
    $inset1 = ($orientation === 'L') ? 14 : 12;
    $inset2 = ($orientation === 'L') ? 16 : 14;
    $pdf->SetDrawColor(...CLR_GOLD);
    $pdf->SetLineWidth(0.8);
    $pdf->Rect($inset1, $inset1 - 3, $W - ($inset1 * 2), $H - ($inset1 * 2) + 6);
    $pdf->SetLineWidth(0.3);
    $pdf->Rect($inset2, $inset2 - 3, $W - ($inset2 * 2), $H - ($inset2 * 2) + 6);

    // 4. Subtle Guilloche Wave Curves Along Borders
    $pdf->SetDrawColor(220, 230, 242);
    for ($gx = 30; $gx <= $W - 30; $gx += 40) {
        $pdf->DrawGuillocheWave($gx, $H - $inset2 - 3, 10, 8, 1.2);
    }

    // 5. Watermark Background Tint
    $pdf->SetFillColor(...CLR_LIGHT);
    $pdf->Rect($inset2 + 1, $inset2 - 2, $W - (($inset2 + 1) * 2), $H - (($inset2 - 2) * 2) - 4, 'F');

    // 6. Official Robotree Brand Logo / Emblem
    $logoPathTransparent = dirname(__DIR__) . '/assets/robotree_logo_transparent.png';
    $logoPathDark = dirname(__DIR__) . '/assets/robotree_logo_dark_transparent.png';
    $logoPathStandard = dirname(__DIR__) . '/assets/robotree_logo.png';

    $logoLoaded = false;
    $logoX = $inset2 + 4;
    $logoY = $inset2 + 1;
    $logoW = ($orientation === 'L') ? 42 : 36;

    foreach ([$logoPathTransparent, $logoPathDark, $logoPathStandard] as $pathCandidate) {
        if (file_exists($pathCandidate)) {
            try {
                $pdf->Image($pathCandidate, $logoX, $logoY, $logoW, 0);
                $logoLoaded = true;
                break;
            } catch (Exception $e) {
                $logoLoaded = false;
            }
        }
    }

    if (!$logoLoaded) {
        $pdf->SafeSetFont('helvetica', 'B', 14);
        $pdf->SetTextColor(...CLR_NAVY);
        $pdf->SetXY($logoX, $logoY + 2);
        $pdf->Cell($logoW, 7, 'ROBOTREE', '', 0, 'L');
        $pdf->SafeSetFont('helvetica', '', 6.5);
        $pdf->SetXY($logoX, $logoY + 8);
        $pdf->Cell($logoW, 4, 'Robotics LLP', '', 0, 'L');
    }

    // 7. Government Protocol Accreditation Seal in Top Right
    $govBadgeW = ($orientation === 'L') ? 72 : 62;
    $govBadgeX = $W - $inset2 - $govBadgeW - 4;
    $govBadgeY = $logoY + 1;
    $pdf->DrawGovernmentProtocolBadge($govBadgeX, $govBadgeY, $govBadgeW);

    // 8. Main "CERTIFICATE" Title
    $titleY = ($orientation === 'L') ? 18 : 26;
    $titleSize = ($orientation === 'L') ? 34 : 28;
    $pdf->SafeSetFont('Cinzel', 'B', $titleSize, 'times');
    $pdf->SetTextColor(...CLR_NAVY);
    $pdf->SetXY(30, $titleY);
    $pdf->Cell($W - 60, 16, 'CERTIFICATE', '', 0, 'C');

    // 9. "OF PARTICIPATION & ACCREDITATION" Banner
$bannerY = $titleY + 17;
$bannerW = ($orientation === 'L') ? 150 : 130;
$bannerH = 9.5;
$bannerX = ($W - $bannerW) / 2;
$pdf->SetFillColor(...CLR_GREEN);
$pdf->RoundedRect($bannerX, $bannerY, $bannerW, $bannerH, 2.5, 'F');

$pdf->SafeSetFont('helvetica', 'B', 11);
$pdf->SetTextColor(...CLR_WHITE);
$pdf->SetXY($bannerX, $bannerY + 0.8);
$pdf->Cell($bannerW, $bannerH - 1.6, 'OF PARTICIPATION & ACCREDITATION', '', 0, 'C');

// 9. "PROUDLY PRESENTED TO" Eyebrow
$eyebrowY = $bannerY + 13;
$pdf->SafeSetFont('helvetica', 'B', 8.5);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY(30, $eyebrowY);
$pdf->Cell($W - 60, 5, 'PROUDLY PRESENTED TO', '', 1, 'C');

// 10. Student Candidate Name (Hero Typography with Vector Dashed Separator)
$nameLineY = $eyebrowY + 7;
$nameBoxW = $W - 110;
$nameBoxX = 55;

// Vector dashed line above name
$pdf->SetDrawColor(...CLR_NAVY);
$pdf->SetLineWidth(0.3);
$pdf->SetDash(1.5, 1.5);
$pdf->Line($nameBoxX, $nameLineY, $W - $nameBoxX, $nameLineY);
$pdf->SetDash(); // Reset to solid

$nameFontSize = ($orientation === 'L') ? 28 : 24;
$pdf->SafeSetFont('times', 'B', $nameFontSize);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY(30, $nameLineY + 1);
$pdf->Cell($W - 60, 14, $studentName, '', 1, 'C');

// Vector dashed line below name
$pdf->SetDash(1.5, 1.5);
$pdf->Line($nameBoxX, $nameLineY + 16, $W - $nameBoxX, $nameLineY + 16);
$pdf->SetDash(); // Reset to solid

// 11. Narrative & Course Details
$textY = $nameLineY + 19;
$pdf->SafeSetFont('helvetica', '', 9.5);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY(30, $textY);
$pdf->Cell($W - 60, 4.5, 'for successfully participating in and completing the practical STEM curriculum', '', 1, 'C');

// Prominent Course Title
$pdf->SafeSetFont('helvetica', 'B', 12.5);
$pdf->SetTextColor(...CLR_GREEN);
$pdf->SetXY(30, $textY + 5.5);
$pdf->Cell($W - 60, 6, $courseTitle, '', 1, 'C');

// Target Audience & Institution Descriptor
$pdf->SafeSetFont('helvetica', '', 9);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY(30, $textY + 12);
$pdf->Cell($W - 60, 4.5, 'Curriculum conducted for ' . $classGroup . ' by Robotree Robotics LLP.', '', 1, 'C');

$pdf->SafeSetFont('helvetica', 'I', 8.5);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY(30, $textY + 17);
$pdf->Cell($W - 60, 4, 'Demonstrating exceptional engineering aptitude, problem-solving mastery, and creative execution.', '', 1, 'C');

// 12. Info Strip: Date | Time | Venue (Adaptive Positioning)
$infoY = ($orientation === 'L') ? 116 : 140;
$infoH = 24;
$infoX = $inset2 + 4;
$infoW = $W - ($infoX * 2);

$pdf->SetFillColor(235, 243, 252);
$pdf->SetDrawColor(...CLR_NAVY);
$pdf->SetLineWidth(0.4);
$pdf->RoundedRect($infoX, $infoY, $infoW, $infoH, 2, 'DF');

// Three Vertical Columns
$colW = $infoW / 3;
$colX1 = $infoX;
$colX2 = $infoX + $colW;
$colX3 = $infoX + ($colW * 2);

$pdf->Line($colX2, $infoY, $colX2, $infoY + $infoH);
$pdf->Line($colX3, $infoY, $colX3, $infoY + $infoH);

// Column 1: DATE
$pdf->SafeSetFont('helvetica', 'B', 7.5);
$pdf->SetTextColor(...CLR_GREEN);
$pdf->SetXY($colX1, $infoY + 2.5);
$pdf->Cell($colW, 4, 'EVENT DATE', '', 1, 'C');
$pdf->SafeSetFont('helvetica', 'B', 9.5);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY($colX1, $infoY + 7.5);
$pdf->Cell($colW, 5.5, $issueDate, '', 1, 'C');
$pdf->SafeSetFont('helvetica', '', 7);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY($colX1, $infoY + 14);
$pdf->Cell($colW, 4, 'Accredited Session', '', 0, 'C');

// Column 2: TIME & DURATION
$pdf->SafeSetFont('helvetica', 'B', 7.5);
$pdf->SetTextColor(...CLR_GREEN);
$pdf->SetXY($colX2, $infoY + 2.5);
$pdf->Cell($colW, 4, 'SCHEDULE / HOURS', '', 1, 'C');
$pdf->SafeSetFont('helvetica', 'B', 9.5);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY($colX2, $infoY + 7.5);
$pdf->Cell($colW, 5.5, $eventTime, '', 1, 'C');
$pdf->SafeSetFont('helvetica', '', 7);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY($colX2, $infoY + 14);
$pdf->Cell($colW, 4, 'Hands-on Lab Training', '', 0, 'C');

// Column 3: VENUE
$pdf->SafeSetFont('helvetica', 'B', 7.5);
$pdf->SetTextColor(...CLR_GREEN);
$pdf->SetXY($colX3, $infoY + 2.5);
$pdf->Cell($colW, 4, 'AUTHORIZED VENUE', '', 1, 'C');
$pdf->SafeSetFont('helvetica', 'B', 9);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY($colX3, $infoY + 7);
$pdf->Cell($colW, 5, strtoupper($venue), '', 1, 'C');
$pdf->SafeSetFont('helvetica', '', 6.5);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY($colX3, $infoY + 13.5);
$pdf->Cell($colW, 4, $venueDetail, '', 0, 'C');

// 13. Dual Signatures & Rosette Accreditation Seal
$sigY = ($orientation === 'L') ? 158 : 194;
$sigW = 55;
$mentorSigX = $infoX + 15;
$directorSigX = $infoX + $infoW - $sigW - 15;

// Mentor Signature Line
$pdf->SetDrawColor(...CLR_NAVY);
$pdf->SetLineWidth(0.4);
$pdf->Line($mentorSigX, $sigY, $mentorSigX + $sigW, $sigY);

$pdf->SafeSetFont('times', 'I', 11);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY($mentorSigX, $sigY - 7);
$pdf->Cell($sigW, 6, 'Rishav Maji', '', 0, 'C');

$pdf->SafeSetFont('helvetica', 'B', 8);
$pdf->SetXY($mentorSigX, $sigY + 1.5);
$pdf->Cell($sigW, 4, 'CHIEF MENTOR', '', 1, 'C');
$pdf->SafeSetFont('helvetica', '', 6.5);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY($mentorSigX, $sigY + 5.5);
$pdf->Cell($sigW, 3.5, 'Robotree Robotics LLP', '', 0, 'C');

// Center Rosette Seal
$sealX = $W / 2;
$sealY = $sigY - 2;
$pdf->DrawRosetteSeal($sealX, $sealY, 13);

// Director Signature Line
$pdf->SetDrawColor(...CLR_NAVY);
$pdf->Line($directorSigX, $sigY, $directorSigX + $sigW, $sigY);

$pdf->SafeSetFont('times', 'I', 11);
$pdf->SetTextColor(...CLR_NAVY);
$pdf->SetXY($directorSigX, $sigY - 7);
$pdf->Cell($sigW, 6, 'Rahul Kumar Ghosh', '', 0, 'C');

$pdf->SafeSetFont('helvetica', 'B', 8);
$pdf->SetXY($directorSigX, $sigY + 1.5);
$pdf->Cell($sigW, 4, 'MANAGING DIRECTOR', '', 1, 'C');
$pdf->SafeSetFont('helvetica', '', 6.5);
$pdf->SetTextColor(...CLR_MUTED);
$pdf->SetXY($directorSigX, $sigY + 5.5);
$pdf->Cell($sigW, 3.5, 'Robotree Robotics LLP', '', 0, 'C');

// 14. Footer Security & Government Protocol Bar (No Commercial Copyright)
$footY = $H - $barHeight + 3.5;
$pdf->SafeSetFont('helvetica', 'B', 6.5);
$pdf->SetTextColor(...CLR_WHITE);
$pdf->SetXY($inset2, $footY);
$pdf->Cell(85, 3.5, 'CERTIFICATE SERIAL ID: ' . $certId, '', 0, 'L');

// Government Protocol text centered
$pdf->SafeSetFont('helvetica', '', 6);
$pdf->SetXY(90, $footY);
$pdf->Cell($W - 180, 3.5, 'Operating in accordance with Government of India Protocols (GeM & MSME Accredited)', '', 0, 'C');

// Verification URL right
$pdf->SafeSetFont('helvetica', 'B', 6.5);
$pdf->SetXY($W - $inset2 - 80, $footY);
$pdf->Cell(80, 3.5, 'Verify Online: robotree.org/certificate.html', '', 0, 'R');
}

// ─── PAGE 2: OFFICIAL COMPETENCY TRANSCRIPT & ACCREDITATION (OPTIONAL) ────────
if ($pageMode === 2) {
    // Enable multi-page handling for this section
    $pdf->setAllowMultiPage(true);
    $pdf->AddPage($orientation, $pageSize);

    // Page 2 Background
    $pdf->SetFillColor(...CLR_WHITE);
    $pdf->Rect(0, 0, $W, $H, 'F');

    // Page 2 Header Bar
    $pdf->SetFillColor(...CLR_NAVY);
    $pdf->Rect(0, 0, $W, 10, 'F');
    $pdf->Rect(0, $H - 8, $W, 8, 'F');

    // Inner Border
    $pdf->SetDrawColor(...CLR_GOLD);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect(12, 12, $W - 24, $H - 24);

    // Title Section
    $pdf->SafeSetFont('Cinzel', 'B', 16, 'times');
    $pdf->SetTextColor(...CLR_NAVY);
    $pdf->SetXY(20, 16);
    $pdf->Cell($W - 40, 8, 'OFFICIAL COMPETENCY TRANSCRIPT & ACCREDITATION RECORD', '', 1, 'C');

    $pdf->SafeSetFont('helvetica', '', 8);
    $pdf->SetTextColor(...CLR_MUTED);
    $pdf->SetXY(20, 24);
    $pdf->Cell($W - 40, 4, 'Attached to Accredited Certificate ID: ' . $certId . ' | Candidate: ' . $studentName, '', 1, 'C');

    // Candidate Summary Box
    $pdf->SetFillColor(245, 248, 252);
    $pdf->SetDrawColor(...CLR_BORDER);
    $pdf->SetLineWidth(0.3);
    $pdf->RoundedRect(20, 30, $W - 40, 16, 2, 'DF');

    $pdf->SafeSetFont('helvetica', 'B', 8);
    $pdf->SetTextColor(...CLR_NAVY);
    $pdf->SetXY(24, 32);
    $pdf->Cell(50, 4, 'Candidate Name: ' . $studentName, '', 0, 'L');
    $pdf->SetXY(120, 32);
    $pdf->Cell(60, 4, 'Course: ' . $courseTitle, '', 0, 'L');
    $pdf->SetXY($W - 85, 32);
    $pdf->Cell(60, 4, 'Issue Date: ' . $issueDate, '', 0, 'L');

    $pdf->SafeSetFont('helvetica', '', 7.5);
    $pdf->SetTextColor(...CLR_MUTED);
    $pdf->SetXY(24, 38);
    $pdf->Cell(50, 4, 'Accreditation: GeM & MSME Registered', '', 0, 'L');
    $pdf->SetXY(120, 38);
    $pdf->Cell(60, 4, 'Evaluation Grade: Grade A (Distinction)', '', 0, 'L');
    $pdf->SetXY($W - 85, 38);
    $pdf->Cell(60, 4, 'Status: Verified & Tamper-Evident', '', 0, 'L');

    // Curriculum Modules Table
    $tableY = 51;
    $col1W = 18;
    $col2W = 85;
    $col3W = 105;
    $col4W = 28;
    if ($orientation === 'P') {
        $col2W = 60;
        $col3W = 75;
        $col4W = 20;
    }

    // Table Header
    $pdf->SetFillColor(...CLR_NAVY);
    $pdf->SetTextColor(...CLR_WHITE);
    $pdf->SafeSetFont('helvetica', 'B', 8);
    $pdf->SetXY(20, $tableY);
    $pdf->Cell($col1W, 7, 'MODULE', 1, 0, 'C', true);
    $pdf->Cell($col2W, 7, 'TOPIC & PRACTICUM', 1, 0, 'L', true);
    $pdf->Cell($col3W, 7, 'KEY SKILLS & COMPETENCIES ACQUIRED', 1, 0, 'L', true);
    $pdf->Cell($col4W, 7, 'RESULT', 1, 1, 'C', true);

    $modules = [
        ['01', 'Microcontroller Architecture & Sensors', 'Embedded C, Arduino/ESP32, Ultrasonic, IR & Gyroscopic sensor fusion', 'Mastered'],
        ['02', 'Autonomous Mobility & Actuators', 'PWM Motor drivers, Differential drive kinematics, Obstacle avoidance algorithms', 'Mastered'],
        ['03', 'Robotic Vision & AI Integration', 'Edge AI models, Computer vision basics, Object classification on camera feeds', 'Mastered'],
        ['04', 'IoT & Cloud Telemetry', 'MQTT Protocols, Remote dashboard monitoring, Real-time telemetry broadcasting', 'Mastered'],
        ['05', 'Capstone Robotics Project', 'End-to-end design, fabrication, assembly, coding, and live field demonstration', 'Distinction']
    ];

    $pdf->SetTextColor(...CLR_NAVY);
    $pdf->SafeSetFont('helvetica', '', 7.5);
    $fill = false;
    foreach ($modules as $m) {
        $pdf->SetFillColor($fill ? 245 : 255, $fill ? 248 : 255, $fill ? 252 : 255);
        $pdf->SetXY(20, $pdf->GetY());
        $pdf->Cell($col1W, 6.5, $m[0], 1, 0, 'C', $fill);
        $pdf->Cell($col2W, 6.5, ' ' . $m[1], 1, 0, 'L', $fill);
        $pdf->Cell($col3W, 6.5, ' ' . $m[2], 1, 0, 'L', $fill);
        $pdf->SafeSetFont('helvetica', 'B', 7.5);
        $pdf->SetTextColor(...CLR_GREEN);
        $pdf->Cell($col4W, 6.5, $m[3], 1, 1, 'C', $fill);
        $pdf->SafeSetFont('helvetica', '', 7.5);
        $pdf->SetTextColor(...CLR_NAVY);
        $fill = !$fill;
    }

    // Official Government Protocol Accreditation Declaration
    $declY = $pdf->GetY() + 8;
    $pdf->SetFillColor(248, 252, 246);
    $pdf->SetDrawColor(...CLR_GREEN);
    $pdf->SetLineWidth(0.3);
    $pdf->RoundedRect(20, $declY, $W - 40, 24, 2, 'DF');

    $pdf->SafeSetFont('helvetica', 'B', 8);
    $pdf->SetTextColor(...CLR_GREEN);
    $pdf->SetXY(24, $declY + 2.5);
    $pdf->Cell($W - 48, 4, 'GOVERNMENT OF INDIA ACCREDITATION & VERIFICATION NOTICE', '', 1, 'L');

    $pdf->SafeSetFont('helvetica', '', 7);
    $pdf->SetTextColor(...CLR_NAVY);
    $pdf->SetXY(24, $declY + 7);
    $pdf->MultiCell($W - 48, 3.8, "Robotree Robotics LLP operates strictly in accordance with Government of India Protocols, maintaining GeM (Government e-Marketplace) and MSME credentials. This credential is electronically signed and verifiable directly in the Robotree public registry.\nVerification Endpoint: https://robotreerobotics.in/certificate.html?id=" . urlencode($certId));

    // Page 2 Footer
    $pdf->SafeSetFont('helvetica', '', 6);
    $pdf->SetTextColor(...CLR_WHITE);
    $pdf->SetXY(12, $H - 6);
    $pdf->Cell($W - 24, 4, 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols • Page 2 of 2', '', 0, 'C');
}

// ─── OUTPUT GENERATION ────────────────────────────────────────────────────────
$cleanName = preg_replace('/[^A-Za-z0-9_-]/', '_', $studentName);
$fileName = 'Robotree_Certificate_' . $cleanName . '_' . $certId . '.pdf';

switch ($outputMode) {
    case 'D':
        // Force browser download
        $pdf->Output('D', $fileName);
        break;
    case 'F':
        // Save to file on server / CLI
        $savePath = $outputFile !== '' ? $outputFile : __DIR__ . '/' . $fileName;
        $pdf->Output('F', $savePath);
        if (PHP_SAPI === 'cli') {
            echo "Certificate generated successfully: " . $savePath . PHP_EOL;
        }
        break;
    case 'S':
        // Return raw binary string / base64
        echo base64_encode($pdf->Output('S', ''));
        break;
    case 'I':
    default:
        // Inline PDF display in browser
        $pdf->Output('I', $fileName);
        break;
}
