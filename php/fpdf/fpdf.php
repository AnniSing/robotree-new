<?php
/*******************************************************************************
 * FPDF 1.86 - Minimal standalone version with core font support
 * https://fpdf.org - Author: Olivier PLATHEY
 *******************************************************************************/
define('FPDF_VERSION','1.86');

class FPDF {
    protected $page=0,$n=2,$buffer='',$pages=[],$state=0,$compress=true,$k=1;
    protected $DefOrientation,$CurOrientation,$StdPageSizes,$DefPageSize,$CurPageSize;
    protected $CurRotation=0,$PageInfo=[],$wPt,$hPt,$w,$h;
    protected $lMargin,$tMargin,$rMargin,$bMargin,$cMargin,$x,$y,$lasth=0;
    protected $LineWidth,$fontpath='',$CoreFonts=[],$fonts=[],$FontFiles=[];
    protected $FontFamily='',$FontStyle='',$underline=false,$CurrentFont=null;
    protected $FontSizePt=12,$FontSize=0,$DrawColor='0 G',$FillColor='0 g';
    protected $TextColor='0 g',$ColorFlag=false,$WithAlpha=false,$ws=0;
    protected $images=[],$PageLinks=[],$links=[],$AutoPageBreak=true;
    protected $PageBreakTrigger=0,$InHeader=false,$InFooter=false;
    protected $AliasNbPages='',$ZoomMode='',$LayoutMode='',$metadata=[],$PDFVersion='1.3';
    protected $offsets=[];

    function __construct($orientation='P',$unit='mm',$size='A4') {
        $this->state=0; $this->n=2;
        $this->StdPageSizes=['a3'=>[841.89,1190.55],'a4'=>[595.28,841.89],'a5'=>[420.94,595.28],'letter'=>[612,792],'legal'=>[612,1008]];
        if($unit=='pt') $this->k=1;
        elseif($unit=='mm') $this->k=72/25.4;
        elseif($unit=='cm') $this->k=72/2.54;
        elseif($unit=='in') $this->k=72;
        else $this->Error('Incorrect unit: '.$unit);
        $this->CoreFonts=['courier','helvetica','times','symbol','zapfdingbats'];
        $size=$this->_getpagesize($size);
        $this->DefPageSize=$size; $this->CurPageSize=$size;
        $orientation=strtolower($orientation);
        if($orientation=='p'||$orientation=='portrait'){$this->DefOrientation='P';$this->w=$size[0];$this->h=$size[1];}
        elseif($orientation=='l'||$orientation=='landscape'){$this->DefOrientation='L';$this->w=$size[1];$this->h=$size[0];}
        else $this->Error('Incorrect orientation: '.$orientation);
        $this->CurOrientation=$this->DefOrientation;
        $this->wPt=$this->w*$this->k; $this->hPt=$this->h*$this->k;
        $this->CurRotation=0;
        $margin=10/$this->k;
        $this->SetMargins($margin,$margin);
        $this->cMargin=$margin/10;
        $this->LineWidth=.567/$this->k;
        $this->SetAutoPageBreak(true,2*$margin);
        $this->SetDisplayMode('default');
        $this->SetCompression(true);
    }

    function SetMargins($left,$top,$right=-1){$this->lMargin=$left;$this->tMargin=$top;if($right==-1)$right=$left;$this->rMargin=$right;}
    function SetLeftMargin($margin){$this->lMargin=$margin;}
    function SetTopMargin($margin){$this->tMargin=$margin;}
    function SetRightMargin($margin){$this->rMargin=$margin;}
    function SetAutoPageBreak($auto,$margin=0){$this->AutoPageBreak=$auto;$this->bMargin=$margin;$this->PageBreakTrigger=$this->h-$margin;}
    function SetDisplayMode($zoom,$layout='default'){$this->ZoomMode=$zoom;$this->LayoutMode=$layout;}
    function SetCompression($compress){$this->compress=function_exists('gzcompress')?$compress:false;}
    function SetTitle($title,$isUTF8=false){$this->metadata['Title']=$isUTF8?$title:utf8_encode($title);}
    function SetAuthor($author,$isUTF8=false){$this->metadata['Author']=$isUTF8?$author:utf8_encode($author);}
    function SetSubject($subject,$isUTF8=false){$this->metadata['Subject']=$isUTF8?$subject:utf8_encode($subject);}
    function SetCreator($creator,$isUTF8=false){$this->metadata['Creator']=$isUTF8?$creator:utf8_encode($creator);}
    function AliasNbPages($alias='{nb}'){$this->AliasNbPages=$alias;}

    function Error($msg){throw new Exception('FPDF error: '.$msg);}

    function Close(){
        if($this->state==3)return;
        if($this->page==0)$this->AddPage();
        $this->InFooter=true;$this->Footer();$this->InFooter=false;
        $this->_endpage();$this->_enddoc();
    }

    function AddPage($orientation='',$size='',$rotation=0){
        if($this->state==3)$this->Error('The document is closed');
        $family=$this->FontFamily;
        $style=$this->FontStyle.($this->underline?'U':'');
        $fontsize=$this->FontSizePt;
        $lw=$this->LineWidth;$dc=$this->DrawColor;$fc=$this->FillColor;$tc=$this->TextColor;$cf=$this->ColorFlag;
        if($this->page>0){$this->InFooter=true;$this->Footer();$this->InFooter=false;$this->_endpage();}
        $this->_beginpage($orientation,$size,$rotation);
        $this->_out('2 J');
        $this->LineWidth=$lw;$this->_out(sprintf('%.2F w',$lw*$this->k));
        if($family)$this->SetFont($family,$style,$fontsize);
        $this->DrawColor=$dc;if($dc!='0 G')$this->_out($dc);
        $this->FillColor=$fc;if($fc!='0 g')$this->_out($fc);
        $this->TextColor=$tc;$this->ColorFlag=$cf;
        $this->InHeader=true;$this->Header();$this->InHeader=false;
        if($this->LineWidth!=$lw){$this->LineWidth=$lw;$this->_out(sprintf('%.2F w',$lw*$this->k));}
        if($family)$this->SetFont($family,$style,$fontsize);
        if($this->DrawColor!=$dc){$this->DrawColor=$dc;$this->_out($dc);}
        if($this->FillColor!=$fc){$this->FillColor=$fc;$this->_out($fc);}
        $this->TextColor=$tc;$this->ColorFlag=$cf;
    }

    function Header(){}
    function Footer(){}
    function PageNo(){return $this->page;}

    function SetDrawColor($r,$g=-1,$b=-1){
        if(($r==0&&$g==0&&$b==0)||$g==-1)$this->DrawColor=sprintf('%.3F G',$r/255);
        else $this->DrawColor=sprintf('%.3F %.3F %.3F RG',$r/255,$g/255,$b/255);
        if($this->page>0)$this->_out($this->DrawColor);
    }
    function SetFillColor($r,$g=-1,$b=-1){
        if(($r==0&&$g==0&&$b==0)||$g==-1)$this->FillColor=sprintf('%.3F g',$r/255);
        else $this->FillColor=sprintf('%.3F %.3F %.3F rg',$r/255,$g/255,$b/255);
        $this->ColorFlag=($this->FillColor!=$this->TextColor);
        if($this->page>0)$this->_out($this->FillColor);
    }
    function SetTextColor($r,$g=-1,$b=-1){
        if(($r==0&&$g==0&&$b==0)||$g==-1)$this->TextColor=sprintf('%.3F g',$r/255);
        else $this->TextColor=sprintf('%.3F %.3F %.3F rg',$r/255,$g/255,$b/255);
        $this->ColorFlag=($this->FillColor!=$this->TextColor);
    }

    function GetStringWidth($s){
        $s=(string)$s;$cw=&$this->CurrentFont['cw'];$w=0;
        $l=strlen($s);for($i=0;$i<$l;$i++)$w+=$cw[ord($s[$i])];
        return $w*$this->FontSize/1000;
    }
    function SetLineWidth($width){$this->LineWidth=$width;if($this->page>0)$this->_out(sprintf('%.2F w',$width*$this->k));}
    function Line($x1,$y1,$x2,$y2){$this->_out(sprintf('%.2F %.2F m %.2F %.2F l S',$x1*$this->k,($this->h-$y1)*$this->k,$x2*$this->k,($this->h-$y2)*$this->k));}
    function Rect($x,$y,$w,$h,$style=''){
        if($style=='F')$op='f';elseif($style=='FD'||$style=='DF')$op='B';else $op='S';
        $this->_out(sprintf('%.2F %.2F %.2F %.2F re %s',$x*$this->k,($this->h-$y)*$this->k,$w*$this->k,-$h*$this->k,$op));
    }

    function SetFont($family,$style='',$size=0){
        if($family=='')$family=$this->FontFamily;
        else $family=strtolower($family);
        $style=strtoupper($style);
        if(strpos($style,'U')!==false){$this->underline=true;$style=str_replace('U','',(string)$style);}
        else $this->underline=false;
        if($style=='IB')$style='BI';
        if($size==0)$size=$this->FontSizePt;
        if($this->FontFamily==$family&&$this->FontStyle==$style&&$this->FontSizePt==$size)return;
        $fontkey=$family.$style;
        if(!isset($this->fonts[$fontkey])){
            if(in_array($family,$this->CoreFonts)){
                if($family=='symbol'||$family=='zapfdingbats')$style='';
                $fontkey=$family.$style;
                if(!isset($this->fonts[$fontkey]))$this->_loadcorefont($family,$style);
            } else $this->Error('Undefined font: '.$family.' '.$style);
        }
        $this->FontFamily=$family;$this->FontStyle=$style;$this->FontSizePt=$size;
        $this->FontSize=$size/$this->k;$this->CurrentFont=&$this->fonts[$fontkey];
        if($this->page>0)$this->_out(sprintf('BT /F%d %.2F Tf ET',$this->CurrentFont['i'],$this->FontSizePt));
    }
    function SetFontSize($size){
        if($this->FontSizePt==$size)return;
        $this->FontSizePt=$size;$this->FontSize=$size/$this->k;
        if($this->page>0)$this->_out(sprintf('BT /F%d %.2F Tf ET',$this->CurrentFont['i'],$this->FontSizePt));
    }

    function AddLink(){$n=count($this->links)+1;$this->links[$n]=array(0,0);return $n;}
    function SetLink($link,$y=0,$page=-1){if($y==-1)$y=$this->y;if($page==-1)$page=$this->page;$this->links[$link]=array($page,$y);}
    function Link($x,$y,$w,$h,$link){$this->PageLinks[$this->page][]=array($x*$this->k,$this->hPt-$y*$this->k,$w*$this->k,$h*$this->k,$link);}

    function Text($x,$y,$txt){
        if(!$this->CurrentFont)$this->Error('No font set');
        $s=sprintf('BT %.2F %.2F Td (%s) Tj ET',$x*$this->k,($this->h-$y)*$this->k,$this->_escape($txt));
        if($this->underline&&$txt!='')$s.=' '.$this->_dounderline($x,$y,$txt);
        if($this->ColorFlag)$s='q '.$this->TextColor.' '.$s.' Q';
        $this->_out($s);
    }

    function AcceptPageBreak(){return $this->AutoPageBreak;}

    function Cell($w,$h=0,$txt='',$border=0,$ln=0,$align='',$fill=false,$link=''){
        if(!$this->CurrentFont)$this->Error('No font set');
        $k=$this->k;
        if($this->y+$h>$this->PageBreakTrigger&&!$this->InHeader&&!$this->InFooter&&$this->AcceptPageBreak()){
            $x=$this->x;$ws=$this->ws;
            if($ws>0){$this->ws=0;$this->_out('0 Tw');}
            $this->AddPage($this->CurOrientation,$this->CurPageSize,$this->CurRotation);
            $this->x=$x;if($ws>0){$this->ws=$ws;$this->_out(sprintf('%.3F Tw',$ws*$k));}
        }
        if($w==0)$w=$this->w-$this->rMargin-$this->x;
        $s='';
        if($fill||$border==1){
            if($fill)$op=($border==1)?'B':'f';else $op='S';
            $s=sprintf('%.2F %.2F %.2F %.2F re %s ',$this->x*$k,($this->h-$this->y)*$k,$w*$k,-$h*$k,$op);
        }
        if(is_string($border)){
            $x=$this->x;$y=$this->y;
            if(strpos($border,'L')!==false)$s.=sprintf('%.2F %.2F m %.2F %.2F l S ',$x*$k,($this->h-$y)*$k,$x*$k,($this->h-($y+$h))*$k);
            if(strpos($border,'T')!==false)$s.=sprintf('%.2F %.2F m %.2F %.2F l S ',$x*$k,($this->h-$y)*$k,($x+$w)*$k,($this->h-$y)*$k);
            if(strpos($border,'R')!==false)$s.=sprintf('%.2F %.2F m %.2F %.2F l S ',($x+$w)*$k,($this->h-$y)*$k,($x+$w)*$k,($this->h-($y+$h))*$k);
            if(strpos($border,'B')!==false)$s.=sprintf('%.2F %.2F m %.2F %.2F l S ',$x*$k,($this->h-($y+$h))*$k,($x+$w)*$k,($this->h-($y+$h))*$k);
        }
        if($txt!==''){
            if(!$this->CurrentFont)$this->Error('No font set');
            if($align=='R')$dx=$w-$this->cMargin-$this->GetStringWidth($txt);
            elseif($align=='C')$dx=($w-$this->GetStringWidth($txt))/2;
            else $dx=$this->cMargin;
            if($this->ColorFlag)$s.='q '.$this->TextColor.' ';
            $s.=sprintf('BT %.2F %.2F Td (%s) Tj ET',($this->x+$dx)*$k,($this->h-($this->y+.5*$h+.3*$this->FontSize))*$k,$this->_escape($txt));
            if($this->underline)$s.=' '.$this->_dounderline($this->x+$dx,$this->y+.5*$h+.3*$this->FontSize,$txt);
            if($this->ColorFlag)$s.=' Q';
            if($link)$this->Link($this->x+$dx,$this->y+.5*$h-.5*$this->FontSize,$this->GetStringWidth($txt),$this->FontSize,$link);
        }
        if($s)$this->_out($s);
        $this->lasth=$h;
        if($ln>0){$this->y+=$h;if($ln==1)$this->x=$this->lMargin;}
        else $this->x+=$w;
    }

    function MultiCell($w,$h,$txt,$border=0,$align='J',$fill=false){
        if(!$this->CurrentFont)$this->Error('No font set');
        $cw=&$this->CurrentFont['cw'];
        if($w==0)$w=$this->w-$this->rMargin-$this->x;
        $wmax=($w-2*$this->cMargin)*1000/$this->FontSize;
        $s=str_replace("\r",'',(string)$txt);
        $nb=strlen($s);
        if($nb>0&&$s[$nb-1]=="\n")$nb--;
        $b=0;
        if($border){if($border==1){$border='LTRB';$b='LRT';$b2='LR';}
        else{$b2='';if(strpos($border,'L')!==false)$b2.='L';if(strpos($border,'R')!==false)$b2.='R';$b=(strpos($border,'T')!==false)?$b2.'T':$b2;}}
        $sep=-1;$i=0;$j=0;$l=0;$ns=0;$nl=1;
        while($i<$nb){
            $c=$s[$i];
            if($c=="\n"){if($this->ws>0){$this->ws=0;$this->_out('0 Tw');}$this->Cell($w,$h,substr($s,$j,$i-$j),$b,2,$align,$fill);$i++;$sep=-1;$j=$i;$l=0;$ns=0;$nl++;if($border&&$nl==2)$b=$b2;continue;}
            if($c==' '){$sep=$i;$ls=$l;$ns++;}
            $l+=$cw[ord($c)];
            if($l>$wmax){
                if($sep==-1){if($i+1<$nb){$i++;continue;}}
                if($this->ws>0){$this->ws=0;$this->_out('0 Tw');}
                if($sep==-1)$i--;else{if($align=='J'){$this->ws=($ns>1)?($wmax-$ls)/1000*$this->FontSize/($ns-1):0;$this->_out(sprintf('%.3F Tw',$this->ws*$this->k));}$i=$sep;}
                $this->Cell($w,$h,substr($s,$j,$i-$j),$b,2,$align,$fill);$i++;$sep=-1;$j=$i;$l=0;$ns=0;$nl++;if($border&&$nl==2)$b=$b2;
            }else $i++;
        }
        if($this->ws>0){$this->ws=0;$this->_out('0 Tw');}
        if($border&&strpos($border,'B')!==false)$b.='B';
        $this->Cell($w,$h,substr($s,$j,$i-$j),$b,2,$align,$fill);
        $this->x=$this->lMargin;
    }

    function Ln($h=-1){$this->x=$this->lMargin;if($h==-1)$this->y+=$this->lasth;else $this->y+=$h;}

    function Image($file,$x=-1,$y=-1,$w=0,$h=0,$type='',$link=''){
        if($file=='')$this->Error('Image file name is empty');
        if(!isset($this->images[$file])){
            if($type==''){$pos=strrpos($file,'.');if(!$pos)$this->Error('Image file has no extension: '.$file);$type=substr($file,$pos+1);}
            $type=strtolower($type);if($type=='jpeg')$type='jpg';
            $mtd='_parse'.$type;
            if(!method_exists($this,$mtd))$this->Error('Unsupported image type: '.$type);
            $info=$this->$mtd($file);$info['i']=count($this->images)+1;$this->images[$file]=$info;
        }else $info=$this->images[$file];
        if($w==0&&$h==0){$w=-96;$h=-96;}
        if($w<0)$w=-$info['w']*72/($w*$this->k);
        if($h<0)$h=-$info['h']*72/($h*$this->k);
        if($w==0)$w=$h*$info['w']/$info['h'];
        if($h==0)$h=$w*$info['h']/$info['w'];
        if($y==-1){if($this->y+$h>$this->PageBreakTrigger&&!$this->InHeader&&$this->AcceptPageBreak()){$x2=$this->x;$this->AddPage($this->CurOrientation,$this->CurPageSize,$this->CurRotation);$this->x=$x2;}$y=$this->y;$this->y+=$h;}
        if($x==-1)$x=$this->x;
        $this->_out(sprintf('q %.2F 0 0 %.2F %.2F %.2F cm /I%d Do Q',$w*$this->k,$h*$this->k,$x*$this->k,($this->h-($y+$h))*$this->k,$info['i']));
        if($link)$this->Link($x,$y,$w,$h,$link);
    }

    function GetPageWidth(){return $this->w;}
    function GetPageHeight(){return $this->h;}
    function GetX(){return $this->x;}
    function SetX($x){if($x>=0)$this->x=$x;else $this->x=$this->w+$x;}
    function GetY(){return $this->y;}
    function SetY($y,$resetX=true){if($y>=0)$this->y=$y;else $this->y=$this->h+$y;if($resetX)$this->x=$this->lMargin;}
    function SetXY($x,$y){$this->SetX($x);$this->SetY($y,false);}

    function Output($dest='',$name='',$isUTF8=false){
        $this->Close();
        if(strlen($name)==1&&strlen($dest)!=1){$tmp=$dest;$dest=$name;$name=$tmp;}
        if($dest=='')$dest='I';if($name=='')$name='doc.pdf';
        switch(strtoupper($dest)){
            case 'I':
                $this->_checkoutput();
                if(PHP_SAPI!='cli'){header('Content-Type: application/pdf');header('Content-Disposition: inline; filename="'.$name.'"');header('Cache-Control: private, max-age=0, must-revalidate');header('Pragma: public');}
                echo $this->buffer;break;
            case 'D':
                $this->_checkoutput();
                header('Content-Type: application/x-download');header('Content-Disposition: attachment; filename="'.$name.'"');header('Cache-Control: private, max-age=0, must-revalidate');header('Pragma: public');
                echo $this->buffer;break;
            case 'F':
                $f=fopen($name,'wb');if(!$f)$this->Error('Unable to create output file: '.$name);fwrite($f,$this->buffer,strlen($this->buffer));fclose($f);break;
            case 'S':return $this->buffer;
            default:$this->Error('Incorrect output destination: '.$dest);
        }
        return '';
    }

    protected function _dochecks(){if(PHP_INT_SIZE<8)$this->Error('FPDF requires 64-bit PHP');}
    protected function _checkoutput(){
        if(PHP_SAPI!='cli'){if(headers_sent($file,$line))$this->Error('Some data has already been output, can\'t send PDF file (output started at '.$file.':'.$line.')');}
        if(ob_get_length()){if(preg_match('/^(\xef\xbb\xbf)?\s*$/',ob_get_contents()))ob_clean();else $this->Error('Some data has already been output, can\'t send PDF file');}
    }
    protected function _getpagesize($size){
        if(is_string($size)){$size=strtolower($size);if(!isset($this->StdPageSizes[$size]))$this->Error('Unknown page size: '.$size);$a=$this->StdPageSizes[$size];return [$a[0]/$this->k,$a[1]/$this->k];}
        else{if($size[0]>$size[1])return [$size[1],$size[0]];else return [$size[0],$size[1]];}
    }
    protected function _beginpage($orientation,$size,$rotation){
        $this->page++;$this->pages[$this->page]='';$this->PageLinks[$this->page]=[];$this->state=2;
        $this->x=$this->lMargin;$this->y=$this->tMargin;$this->FontFamily='';
        if($orientation=='')$orientation=$this->DefOrientation;else $orientation=strtoupper($orientation[0]);
        if($size=='')$size=$this->DefPageSize;else $size=$this->_getpagesize($size);
        if($orientation!=$this->CurOrientation||$size[0]!=$this->CurPageSize[0]||$size[1]!=$this->CurPageSize[1]){
            if($orientation=='P'){$this->w=$size[0];$this->h=$size[1];}else{$this->w=$size[1];$this->h=$size[0];}
            $this->wPt=$this->w*$this->k;$this->hPt=$this->h*$this->k;$this->PageBreakTrigger=$this->h-$this->bMargin;
            $this->CurOrientation=$orientation;$this->CurPageSize=$size;
        }
        if($orientation!=$this->DefOrientation||$size[0]!=$this->DefPageSize[0]||$size[1]!=$this->DefPageSize[1])$this->PageInfo[$this->page]['size']=[$this->wPt,$this->hPt];
        if($rotation!=0){if($rotation%90!=0)$this->Error('Invalid rotation value: '.$rotation);$this->PageInfo[$this->page]['rotate']=$rotation;}
        $this->CurRotation=$rotation;
    }
    protected function _endpage(){$this->state=1;}
    protected function _loadcorefont($family,$style){
        $cw=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,552,400,549,333,333,333,576,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,549,611,556,556,556,556,500,556,500];
        $name=ucfirst($family).($style?'-'.str_replace('B','Bold',str_replace('I','Italic',$style)):'');
        $this->fonts[$family.$style]=['i'=>0,'type'=>'Core','name'=>$name,'up'=>-100,'ut'=>50,'cw'=>$cw];
    }
    protected function _escape($s){$s=str_replace('\\','\\\\',(string)$s);$s=str_replace('(','\\(',$s);$s=str_replace(')','\\)',$s);$s=str_replace("\r",'',$s);return $s;}
    protected function _dounderline($x,$y,$txt){
        $up=$this->CurrentFont['up'];$ut=$this->CurrentFont['ut'];
        $w=$this->GetStringWidth($txt)+$this->ws*substr_count($txt,' ');
        return sprintf('%.2F %.2F %.2F %.2F re f',$x*$this->k,($this->h-($y-$up/1000*$this->FontSize))*$this->k,$w*$this->k,-$ut/1000*$this->FontSizePt);
    }
    protected function _parsejpg($file){
        $a=getimagesize($file);if(!$a)$this->Error('Missing or incorrect image file: '.$file);if($a[2]!=2)$this->Error('Not a JPEG file: '.$file);
        if(!isset($a['channels'])||$a['channels']==3)$cs='DeviceRGB';elseif($a['channels']==4)$cs='DeviceCMYK';else $cs='DeviceGray';
        $bpc=isset($a['bits'])?$a['bits']:8;$data=file_get_contents($file);
        return ['w'=>$a[0],'h'=>$a[1],'cs'=>$cs,'bpc'=>$bpc,'f'=>'DCTDecode','data'=>$data];
    }
    protected function _parsepng($file){
        $f=fopen($file,'rb');if(!$f)$this->Error("Can't open image file: ".$file);$info=$this->_parsepngstream($f,$file);fclose($f);return $info;
    }
    protected function _parsepngstream($f,$file){
        if($this->_readstream($f,8)!=chr(137).chr(80).chr(78).chr(71).chr(13).chr(10).chr(26).chr(10))$this->Error('Not a PNG file: '.$file);
        $this->_readstream($f,4);if($this->_readstream($f,4)!='IHDR')$this->Error('Incorrect PNG file: '.$file);
        $w=$this->_readint($f);$h=$this->_readint($f);$bpc=ord($this->_readstream($f,1));
        if($bpc>8)$this->Error('16-bit depth not supported: '.$file);
        $ct=ord($this->_readstream($f,1));
        if($ct==0||$ct==4)$cs='DeviceGray';elseif($ct==2||$ct==6)$cs='DeviceRGB';elseif($ct==3)$cs='Indexed';else $this->Error('Unknown color type: '.$file);
        if(ord($this->_readstream($f,1))!=0)$this->Error('Unknown compression method: '.$file);
        if(ord($this->_readstream($f,1))!=0)$this->Error('Unknown filter method: '.$file);
        if(ord($this->_readstream($f,1))!=0)$this->Error('Interlacing not supported: '.$file);
        $this->_readstream($f,4);
        $dp='/Predictor 15 /Colors '.($cs=='DeviceRGB'?3:1).' /BitsPerComponent '.$bpc.' /Columns '.$w;
        $pal='';$trns='';$data='';
        do{
            $n=$this->_readint($f);$type=$this->_readstream($f,4);
            if($type=='PLTE'){$pal=$this->_readstream($f,$n);$this->_readstream($f,4);}
            elseif($type=='tRNS'){$t=$this->_readstream($f,$n);if($ct==0)$trns=[ord(substr($t,1,1))];elseif($ct==2)$trns=[ord(substr($t,1,1)),ord(substr($t,3,1)),ord(substr($t,5,1))];else{$pos=strpos($t,chr(0));if($pos!==false)$trns=[$pos];}$this->_readstream($f,4);}
            elseif($type=='IDAT'){$data.=$this->_readstream($f,$n);$this->_readstream($f,4);}
            elseif($type=='IEND')break;
            else $this->_readstream($f,$n+4);
        }while(true);
        if($cs=='Indexed'&&empty($pal))$this->Error('Missing palette in '.$file);
        $info=['w'=>$w,'h'=>$h,'cs'=>$cs,'bpc'=>$bpc,'f'=>'FlateDecode','dp'=>$dp,'pal'=>$pal,'trns'=>$trns,'data'=>$data];
        return $info;
    }
    protected function _readstream($f,$n){
        $res='';while($n>0&&!feof($f)){$s=fread($f,$n);if($s===false)$this->Error('Error while reading stream');$n-=strlen($s);$res.=$s;}
        if($n>0)$this->Error('Unexpected end of stream');return $res;
    }
    protected function _readint($f){$a=unpack('Ni',$this->_readstream($f,4));return $a['i'];}
    protected function _out($s){
        if($this->state==2)$this->pages[$this->page].=$s."\n";
        elseif($this->state==1)$this->_put($s);
        elseif($this->state==0)$this->Error('No page has been added yet');
        elseif($this->state==3)$this->Error('The document is closed');
    }
    protected function _put($s){$this->buffer.=$s."\n";}
    protected function _getoffset(){return strlen($this->buffer);}
    protected function _newobj($n=-1){if($n==-1)$n=++$this->n;$this->offsets[$n]=$this->_getoffset();$this->_put($n.' 0 obj');return $n;}
    protected function _putstream($s){$this->_put('stream');$this->_put($s);$this->_put('endstream');}
    protected function _putstreamobject($data){
        if($this->compress){$entries='/Filter /FlateDecode ';$data=gzcompress($data);}else $entries='';
        $entries.='/Length '.strlen($data);$this->_newobj();$this->_put('<<'.$entries.'>>');$this->_putstream($data);$this->_put('endobj');
    }
    protected function _putlinks($n){
        foreach($this->PageLinks[$n] as $pl){
            $this->_newobj();$rect=sprintf('%.2F %.2F %.2F %.2F',$pl[0],$pl[1],$pl[0]+$pl[2],$pl[1]-$pl[3]);
            $s='<</Type /Annot /Subtype /Link /Rect ['.$rect.'] /Border [0 0 0] ';
            if(is_string($pl[4]))$s.='/A <</S /URI /URI ('.$this->_escape($pl[4]).') >> >>';
            else{$l=$this->links[$pl[4]];$h=isset($this->PageInfo[$l[0]]['size'])?$this->PageInfo[$l[0]]['size'][1]:($this->DefOrientation=='P'?$this->DefPageSize[1]*$this->k:$this->DefPageSize[0]*$this->k);$s.=sprintf('/Dest [%d 0 R /XYZ 0 %.2F null]',$this->PageInfo[$l[0]]['n'],$h-$l[1]*$this->k).'>>';}
            $this->_put($s);$this->_put('endobj');
        }
    }
    protected function _putpage($n){
        $this->_newobj();$this->_put('<</Type /Page');$this->_put('/Parent 1 0 R');
        if(isset($this->PageInfo[$n]['size']))$this->_put(sprintf('/MediaBox [0 0 %.2F %.2F]',$this->PageInfo[$n]['size'][0],$this->PageInfo[$n]['size'][1]));
        if(isset($this->PageInfo[$n]['rotate']))$this->_put('/Rotate '.$this->PageInfo[$n]['rotate']);
        $this->_put('/Resources 2 0 R');
        if(!empty($this->PageLinks[$n])){$s='/Annots [';foreach($this->PageLinks[$n] as $pl)$s.=$pl[5].' 0 R ';$s.=']';$this->_put($s);}
        $this->_put('/Contents '.($this->n+1).' 0 R>>');$this->_put('endobj');
        $data=$this->compress?gzcompress($this->pages[$n]):$this->pages[$n];$this->_putstreamobject($data);
    }
    protected function _putpages(){
        $nb=$this->page;
        for($n=1;$n<=$nb;$n++){$this->PageInfo[$n]['n']=$this->n+1;$this->_putpage($n);}
        $this->_newobj(1);$this->_put('<</Type /Pages');$kids='/Kids [';
        for($i=1;$i<=$nb;$i++)$kids.=$this->PageInfo[$i]['n'].' 0 R ';
        $this->_put($kids.']');$this->_put('/Count '.$nb);
        $w=$this->DefOrientation=='P'?$this->DefPageSize[0]:$this->DefPageSize[1];
        $h=$this->DefOrientation=='P'?$this->DefPageSize[1]:$this->DefPageSize[0];
        $this->_put(sprintf('/MediaBox [0 0 %.2F %.2F]',$w*$this->k,$h*$this->k));$this->_put('>>');$this->_put('endobj');
    }
    protected function _putfonts(){
        foreach($this->fonts as $k=>$font){
            $this->_newobj();$this->fonts[$k]['n']=$this->n;
            if($font['type']=='Core'){$this->_put('<</Type /Font');$this->_put('/BaseFont /'.$font['name']);$this->_put('/Subtype /Type1');if($font['name']!='Symbol'&&$font['name']!='ZapfDingbats')$this->_put('/Encoding /WinAnsiEncoding');$this->_put('>>');}
            $this->_put('endobj');
        }
    }
    protected function _putimages(){foreach($this->images as $file=>&$info){$this->_putimage($info);unset($this->images[$file]['data']);}}
    protected function _putimage(&$info){
        $this->_newobj();$info['n']=$this->n;$this->_put('<</Type /XObject');$this->_put('/Subtype /Image');$this->_put('/Width '.$info['w']);$this->_put('/Height '.$info['h']);
        if($info['cs']=='Indexed')$this->_put('/ColorSpace [/Indexed /DeviceRGB '.(strlen($info['pal'])/3-1).' '.($this->n+1).' 0 R]');
        else{$this->_put('/ColorSpace /'.$info['cs']);if($info['cs']=='DeviceCMYK')$this->_put('/Decode [1 0 1 0 1 0 1 0]');}
        $this->_put('/BitsPerComponent '.$info['bpc']);if(isset($info['f']))$this->_put('/Filter /'.$info['f']);if(isset($info['dp']))$this->_put('/DecodeParms <<'.$info['dp'].'>>');
        if(isset($info['trns'])&&is_array($info['trns'])){$trns='';for($i=0;$i<count($info['trns']);$i++)$trns.=$info['trns'][$i].' '.$info['trns'][$i].' ';$this->_put('/Mask ['.$trns.']');}
        $this->_put('/Length '.strlen($info['data']).'>>');$this->_putstream($info['data']);$this->_put('endobj');
        if($info['cs']=='Indexed')$this->_putstreamobject($info['pal']);
    }
    protected function _putxobjectdict(){foreach($this->images as $image)$this->_put('/I'.$image['i'].' '.$image['n'].' 0 R');}
    protected function _putresourcedict(){
        $this->_put('/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');$this->_put('/Font <<');
        foreach($this->fonts as $font)$this->_put('/F'.$font['i'].' '.$font['n'].' 0 R');
        $this->_put('>>');$this->_put('/XObject <<');$this->_putxobjectdict();$this->_put('>>');
    }
    protected function _putresources(){
        $this->_putfonts();$this->_putimages();$this->_newobj(2);$this->_put('<<');$this->_putresourcedict();$this->_put('>>');$this->_put('endobj');
    }
    protected function _putinfo(){
        $this->metadata['Producer']='FPDF '.FPDF_VERSION;$this->metadata['CreationDate']='D:'.@date('YmdHis');
        foreach($this->metadata as $key=>$value)$this->_put('/'.$key.' ('.$this->_escape($value).')');
    }
    protected function _putcatalog(){
        $n=$this->PageInfo[1]['n'];$this->_put('/Type /Catalog');$this->_put('/Pages 1 0 R');
        if($this->ZoomMode=='fullpage')$this->_put('/OpenAction ['.$n.' 0 R /Fit]');
        elseif($this->ZoomMode=='fullwidth')$this->_put('/OpenAction ['.$n.' 0 R /FitH null]');
        elseif($this->ZoomMode=='real')$this->_put('/OpenAction ['.$n.' 0 R /XYZ null null 1]');
        if($this->LayoutMode=='single')$this->_put('/PageLayout /SinglePage');
        elseif($this->LayoutMode=='continuous')$this->_put('/PageLayout /OneColumn');
    }
    protected function _putheader(){$this->_put('%PDF-'.$this->PDFVersion);}
    protected function _puttrailer(){$this->_put('/Size '.($this->n+1));$this->_put('/Root '.$this->n.' 0 R');$this->_put('/Info '.($this->n-1).' 0 R');}
    protected function _enddoc(){
        $this->_putheader();$this->_putpages();$this->_putresources();
        $this->_newobj();$this->_put('<<');$this->_putinfo();$this->_put('>>');$this->_put('endobj');
        $this->_newobj();$this->_put('<<');$this->_putcatalog();$this->_put('>>');$this->_put('endobj');
        $offset=$this->_getoffset();$this->_put('xref');$this->_put('0 '.($this->n+1));$this->_put('0000000000 65535 f ');
        for($i=1;$i<=$this->n;$i++)$this->_put(sprintf('%010d 00000 n ',$this->offsets[$i]));
        $this->_put('trailer');$this->_put('<<');$this->_puttrailer();$this->_put('>>');$this->_put('startxref');$this->_put($offset);$this->_put('%%EOF');$this->state=3;
    }
}
