<?php
/*******************************************************************************
* Utility to generate font definition files for FPDF                           *
*                                                                              *
* Version: 1.14                                                                *
* Date:    2015-11-29                                                          *
* Author:  Olivier PLATHEY                                                     *
*******************************************************************************/

require_once __DIR__ . '/ttfparser.php';

function Message($ms, $fatal = false) {
    if (PHP_SAPI === 'cli') {
        echo ($fatal ? 'Error: ' : '') . $ms . PHP_EOL;
    } else {
        echo ($fatal ? '<b>Error:</b> ' : '') . htmlspecialchars($ms) . "<br>\n";
    }
    if ($fatal) {
        exit(1);
    }
}

function Notice($ms) {
    Message($ms, false);
}

function Warning($ms) {
    Notice('Warning: ' . $ms);
}

function Error($ms) {
    Message($ms, true);
}

function MakeFont($fontfile, $enc = 'cp1252', $embed = true) {
    // Generate font definition file and compressed file
    if (!file_exists($fontfile)) {
        Error('Font file not found: ' . $fontfile);
    }

    $ext = strtolower(pathinfo($fontfile, PATHINFO_EXTENSION));
    if ($ext !== 'ttf' && $ext !== 'otf') {
        Error('Unrecognized font file extension: ' . $ext);
    }

    $parser = new TTFParser($fontfile);
    $info = $parser->Parse();

    $basename = substr(basename($fontfile), 0, -4);
    $phpfile = $basename . '.php';

    // Compress font file if embedding
    if ($embed) {
        if (!function_exists('gzcompress')) {
            Error('zlib extension is required to embed font');
        }
        $s = file_get_contents($fontfile);
        $fontfile_z = $basename . '.z';
        file_put_contents($fontfile_z, gzcompress($s));
        $info['file'] = $fontfile_z;
    }

    // Generate PHP definition file
    $s = "<?php\n";
    $s .= "\$type = '" . $info['type'] . "';\n";
    $s .= "\$name = '" . $info['name'] . "';\n";
    $s .= "\$desc = " . var_export($info['desc'], true) . ";\n";
    $s .= "\$up = " . $info['up'] . ";\n";
    $s .= "\$ut = " . $info['ut'] . ";\n";
    $s .= "\$cw = " . var_export($info['cw'], true) . ";\n";
    $s .= "\$enc = '" . $enc . "';\n";
    if (isset($info['file'])) {
        $s .= "\$file = '" . $info['file'] . "';\n";
        $s .= "\$originalsize = " . filesize($fontfile) . ";\n";
    }
    $s .= "?>";

    file_put_contents($phpfile, $s);
    Notice("Font definition file successfully generated: $phpfile");
    if ($embed) {
        Notice("Compressed font file successfully generated: $fontfile_z");
    }
}
