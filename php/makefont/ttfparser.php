<?php
/*******************************************************************************
* TTFParser: Extract metrics and tables from TTF / OTF font files              *
*                                                                              *
* Version: 1.1                                                                 *
* Date:    2015-11-29                                                          *
* Author:  Olivier PLATHEY                                                     *
*******************************************************************************/

class TTFParser {
    protected $f;
    protected $tables;
    protected $unitsPerEm;
    protected $ascent;
    protected $descent;
    protected $capHeight;
    protected $flags;
    protected $bbox;
    protected $underlinePosition;
    protected $underlineThickness;
    protected $isFixedPitch;
    protected $chars;
    protected $numberOfHMetrics;
    protected $widths;

    public function __construct($file) {
        $this->f = fopen($file, 'rb');
        if (!$this->f) {
            throw new Exception('Can\'t open file: ' . $file);
        }
    }

    public function __destruct() {
        if (is_resource($this->f)) {
            fclose($this->f);
        }
    }

    public function Parse() {
        $this->ParseOffsetTable();
        $this->ParseHead();
        $this->ParseHhea();
        $this->ParseMaxp();
        $this->ParseHmtx();
        $this->ParseLoca();
        $this->ParseGlyf();
        $this->ParseCmap();
        $name = $this->ParseName();
        $this->ParseOS2();
        $this->ParsePost();

        // Build character widths array [0..255]
        $cw = [];
        for ($c = 0; $c <= 255; $c++) {
            $cw[chr($c)] = $this->chars[$c] ?? 0;
        }

        return [
            'type' => 'TrueType',
            'name' => $name,
            'desc' => [
                'Ascent' => $this->ascent,
                'Descent' => $this->descent,
                'CapHeight' => $this->capHeight,
                'Flags' => $this->flags,
                'FontBBox' => '[' . implode(' ', $this->bbox) . ']',
                'ItalicAngle' => 0,
                'StemV' => 70,
                'MissingWidth' => $this->chars[0] ?? 0
            ],
            'up' => $this->underlinePosition,
            'ut' => $this->underlineThickness,
            'cw' => $cw
        ];
    }

    protected function ParseOffsetTable() {
        $version = $this->Read(4);
        $numTables = $this->ReadUShort();
        $this->Skip(6);
        $this->tables = [];
        for ($i = 0; $i < $numTables; $i++) {
            $tag = $this->Read(4);
            $this->Skip(4);
            $offset = $this->ReadULong();
            $length = $this->ReadULong();
            $this->tables[$tag] = ['offset' => $offset, 'length' => $length];
        }
    }

    protected function Seek($tag) {
        if (!isset($this->tables[$tag])) {
            throw new Exception('Table not found: ' . $tag);
        }
        fseek($this->f, $this->tables[$tag]['offset'], SEEK_SET);
    }

    protected function Skip($n) {
        fseek($this->f, $n, SEEK_CUR);
    }

    protected function Read($n) {
        return fread($this->f, $n);
    }

    protected function ReadUShort() {
        $a = unpack('nn', fread($this->f, 2));
        return $a['n'];
    }

    protected function ReadShort() {
        $a = unpack('nn', fread($this->f, 2));
        $v = $a['n'];
        if ($v >= 0x8000) $v -= 0x10000;
        return $v;
    }

    protected function ReadULong() {
        $a = unpack('NN', fread($this->f, 4));
        return $a['N'];
    }

    protected function ParseHead() {
        $this->Seek('head');
        $this->Skip(18);
        $this->unitsPerEm = $this->ReadUShort();
        $this->Skip(16);
        $xMin = $this->ReadShort();
        $yMin = $this->ReadShort();
        $xMax = $this->ReadShort();
        $yMax = $this->ReadShort();
        $scale = 1000 / $this->unitsPerEm;
        $this->bbox = [
            round($xMin * $scale),
            round($yMin * $scale),
            round($xMax * $scale),
            round($yMax * $scale)
        ];
    }

    protected function ParseHhea() {
        $this->Seek('hhea');
        $this->Skip(4);
        $scale = 1000 / $this->unitsPerEm;
        $this->ascent = round($this->ReadShort() * $scale);
        $this->descent = round($this->ReadShort() * $scale);
        $this->Skip(24);
        $this->numberOfHMetrics = $this->ReadUShort();
    }

    protected function ParseMaxp() {
        $this->Seek('maxp');
        $this->Skip(4);
        $this->numGlyphs = $this->ReadUShort();
    }

    protected function ParseHmtx() {
        $this->Seek('hmtx');
        $scale = 1000 / $this->unitsPerEm;
        $this->widths = [];
        for ($i = 0; $i < $this->numberOfHMetrics; $i++) {
            $advanceWidth = $this->ReadUShort();
            $this->Skip(2);
            $this->widths[$i] = round($advanceWidth * $scale);
        }
    }

    protected function ParseLoca() {}
    protected function ParseGlyf() {}

    protected function ParseCmap() {
        $this->Seek('cmap');
        $this->Skip(2);
        $numTables = $this->ReadUShort();
        $offset31 = 0;
        $offset0 = 0;
        for ($i = 0; $i < $numTables; $i++) {
            $platformID = $this->ReadUShort();
            $encodingID = $this->ReadUShort();
            $offset = $this->ReadULong();
            if ($platformID == 3 && $encodingID == 1) $offset31 = $offset;
            if ($platformID == 0 && $encodingID == 3) $offset0 = $offset;
        }

        $offset = $offset31 ? $offset31 : $offset0;
        if (!$offset) {
            $this->chars = array_fill(0, 256, 500);
            return;
        }

        fseek($this->f, $this->tables['cmap']['offset'] + $offset, SEEK_SET);
        $format = $this->ReadUShort();
        $this->chars = [];
        if ($format == 4) {
            $length = $this->ReadUShort();
            $this->Skip(2);
            $segCount = $this->ReadUShort() / 2;
            $this->Skip(6);
            $endCount = [];
            for ($i = 0; $i < $segCount; $i++) $endCount[] = $this->ReadUShort();
            $this->Skip(2);
            $startCount = [];
            for ($i = 0; $i < $segCount; $i++) $startCount[] = $this->ReadUShort();
            $idDelta = [];
            for ($i = 0; $i < $segCount; $i++) $idDelta[] = $this->ReadShort();
            $idRangeOffset_offset = ftell($this->f);
            $idRangeOffset = [];
            for ($i = 0; $i < $segCount; $i++) $idRangeOffset[] = $this->ReadUShort();

            for ($i = 0; $i < $segCount; $i++) {
                for ($c = $startCount[$i]; $c <= $endCount[$i]; $c++) {
                    if ($idRangeOffset[$i] == 0) {
                        $glyph = ($c + $idDelta[$i]) & 0xFFFF;
                    } else {
                        $offset = $idRangeOffset_offset + 2 * $i + $idRangeOffset[$i] + ($c - $startCount[$i]) * 2;
                        fseek($this->f, $offset, SEEK_SET);
                        $glyph = $this->ReadUShort();
                        if ($glyph != 0) $glyph = ($glyph + $idDelta[$i]) & 0xFFFF;
                    }
                    if ($c <= 255) {
                        $this->chars[$c] = $this->widths[$glyph] ?? 500;
                    }
                }
            }
        }
    }

    protected function ParseName() {
        $this->Seek('name');
        $this->Skip(2);
        $count = $this->ReadUShort();
        $stringOffset = $this->ReadUShort();
        $name = 'CustomFont';
        for ($i = 0; $i < $count; $i++) {
            $platformID = $this->ReadUShort();
            $encodingID = $this->ReadUShort();
            $languageID = $this->ReadUShort();
            $nameID = $this->ReadUShort();
            $length = $this->ReadUShort();
            $offset = $this->ReadUShort();
            if ($nameID == 6) { // PostScript name
                $pos = ftell($this->f);
                fseek($this->f, $this->tables['name']['offset'] + $stringOffset + $offset, SEEK_SET);
                $s = $this->Read($length);
                $name = str_replace(chr(0), '', $s);
                fseek($this->f, $pos, SEEK_SET);
                break;
            }
        }
        return preg_replace('/[^A-Za-z0-9_-]/', '', $name);
    }

    protected function ParseOS2() {
        if (!isset($this->tables['OS/2'])) {
            $this->capHeight = $this->ascent;
            $this->flags = 32;
            return;
        }
        $this->Seek('OS/2');
        $this->Skip(8);
        $this->flags = 32;
        $this->Skip(80);
        $scale = 1000 / $this->unitsPerEm;
        $this->capHeight = round($this->ReadShort() * $scale);
    }

    protected function ParsePost() {
        if (!isset($this->tables['post'])) {
            $this->underlinePosition = -100;
            $this->underlineThickness = 50;
            return;
        }
        $this->Seek('post');
        $this->Skip(8);
        $scale = 1000 / $this->unitsPerEm;
        $this->underlinePosition = round($this->ReadShort() * $scale);
        $this->underlineThickness = round($this->ReadShort() * $scale);
    }
}
