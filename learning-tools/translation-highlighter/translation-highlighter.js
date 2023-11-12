/************************************************
Renders binary division diagrams from an array

2020 Alejandro Rojo Gualix

Creative Commons license
CC BY-NC Attribution & Non-commercial
*************************************************/


/*
getCurrentSegment
cómo saber la selección, toma el valor final
si tienes el cursor entre 123 y /
 
qué pasa si hay números en el texto
 
llamadas desde ahí
desplegable con 4 combinaciones glosa en 1 y/2

es una anotación MARKUP
 
misma altura de textarea, RESIZE
 
*/

// color array by http://phrogz.net/css/distinct-colors.html
//const colors = ['#b21800', '#4c2213', '#b25f00', '#4c3913', '#b28f00', '#fbffbf', '#aaff00', '#598c46', '#00ff88', '#ace6da', '#00ffee', '#00474d', '#00add9', '#002233', '#3d85f2', '#00258c', '#8f8fbf', '#4400ff', '#300033', '#f23dce', '#8c004b', '#bf8fa3', '#f23d55'];
const colors = ['#d10000', '#798138', '#006b63', '#007cfe', '#c33eda', '#ff4b00', '#535c13', '#305e63', '#0061ff', '#c30073', '#8c4219', '#00a900', '#568389', '#3940a2', '#713958', '#b8673c', '#006300', '#00a0d8', '#746fd9', '#a66a8a', '#9f4d00', '#005d00', '#0068a1', '#3d25ff', '#ff53a6', '#dd7f00', '#008d27', '#0098ff', '#7a4fff', '#ce002a', '#828100', '#008e7b', '#0057a1', '#8900a2', '#ff4d57'];
const backcolors = ['#ffc5b5', '#ff8400', '#ffcb00', '#f2fcc0', '#b0ffbe', '#00f2ff', '#c6c5ff', '#ffabd5', '#ff956c', '#ffb13a', '#fdec00', '#c9ff7c', '#00eb95', '#76d6ff', '#f1efff', '#f5d0e2', '#fac098', '#ffd183', '#fffb7e', '#90ff00', '#00ecd1', '#b2d5ff', '#ff90ff', '#ffa6b7', '#ffa75c', '#ffeac1', '#d7ff10', '#42e951', '#d6fefe', '#8ebaff', '#ffb8ff'];
let fileName1 = 'text-1.txt';
let fileName2 = 'text-2.txt';


function resizeTxt(obj) {

    return;

    let id = $(obj).attr('id');
    alert(id);
    onkeyup_textarea_vertical_fit(
        document.getElementById('input1'),
        document.getElementById('input2'));
}

// #region "user interface"
var input_onkeyup = function (obj) {
    update();
}




// #region "textbox"

function linkSelection(source, target) {
    let pos = target.prop('selectionStart');

    let sourceCS = getCurrentSegment(source);
    let targetCS = getCurrentSegment(target);
    console.log(sourceCS, targetCS);

    let text = target.val();
    var newText = text.substring(0, targetCS.start) +
        sourceCS.index + text.substring(targetCS.start + String(targetCS.index).length); // replace index
    target.val(newText);

    // adjust position taking into account inserted text length
    pos += String(sourceCS.index).length - String(targetCS.index).length;
    target.prop('selectionStart', pos).prop('selectionEnd', pos);
}

var lastPos;
jQuery('textarea').bind('click', function (e) {
    //function txtClick(e) {
    let $obj = $(e.target);
    let pos = $obj.prop('selectionStart');

    // get the contiguous text area object
    let contiguousTextArea = ($obj.attr('id') == 'input1') ? $('#input2') : $('#input1');


    // console.log('txtClick');
    if (e.detail == 2) { // DOUBLECLICK segment
        // word insertion position
        if ($('#cBoundary').prop('checked')) {
            $obj.prop('selectionEnd', pos); // selectionStart and selectionEnd must be the same in order to avoid replacing chars
        } else { // we must retrieve last position because current position is already set to clicked word start
            $obj.prop('selectionStart', lastPos).prop('selectionEnd', lastPos);
        }

        if (e.altKey) {// segment and link
            let selection = getCurrentSegment(contiguousTextArea);
            $obj.insertAtCaret(selection.index + '/');
        } else {
            $obj.insertAtCaret('0/');// temporal value
        }
        // Resort values, remove temporal 0/ index
        sortArrays();

    } else { // single click

        if (e.ctrlKey) { // map selections
            linkSelection(contiguousTextArea, $obj);

        } else { // select
            // variable updated for double clicks
            lastPos = pos;//$obj.prop('selectionStart');
            // console.log('POS ', lastPos);

            // display selected segment
            let selection = getCurrentSegment($obj);
            if (selection === null) {
                $obj.parent().find("span").text('');
            } else {
                $obj.parent().find("span").text('[' + selection.index + '] ' + selection.value);
            }

        }
    }
});



// #endregion


// #region "data"

const segmentRegex = /(\d+)\/([^\d]+)/gm;
// if regexp has no flag g, looks for the first match and returns it as an array
// ^ and $ are important
const prePartRegex = /(\d+)\/([^\d]*)$/;
//const postPartRegex = /^([^\d]+)(?:\d+\/|$)/g;
const postPartRegex = /^([^\d\/](?!\d+\/[^\d]+))+/g;
//const startUnmappedRegex = /^(.+)(?:\d+\/)/;
const startUnmappedRegex = /^.+(?=\d+\/)/;

function parseData(data) {
    var segments = [];
    let m;
    while ((m = segmentRegex.exec(data)) !== null) {
        if (m.index === segmentRegex.lastIndex) segmentRegex.lastIndex++;    // This is necessary to avoid infinite loops with zero-width matches
        segments.push({ id: Number(m[1]), value: m[2] });
    }
    // We check the unindexed part of the text.
    // If it exists, it starts the text but it can also extend to the whole text when no segments have been defined
    let firstSegmentPos = data.search(/\d+\//);
    return {
        beforeSegments: (firstSegmentPos == -1) ? data : data.substring(0, firstSegmentPos),
        segments: segments
    };
}

// parsedData1, parsedData2 nust be objects returned from function parseData
function orderMapping(parsedData1, parsedData2) {
    //console.log(parsedData1, parsedData2);

    // Extract index
    var tuple1Index = parsedData1.segments.map(x => x.id);
    /* reorder indexes
    interesa encontrar los elementos no comunes para asignar números únicos a los elementos desemparejados
    tiene preferencia el texto 1
    */
    var counter = 0;
    var arrmap = []; // id -> newid
    for (let n = 0; n < Math.max(parsedData1.segments.length, parsedData2.segments.length); n++) {
        if (n < parsedData1.segments.length) {
            if (!arrmap[parsedData1.segments[n].id]) {
                counter++;
                arrmap[parsedData1.segments[n].id] = counter;
            }
        }
        if (n < parsedData2.segments.length) {
            if (!arrmap[parsedData2.segments[n].id] && !tuple1Index.includes(parsedData2.segments[n].id)) {
                counter++;
                arrmap[parsedData2.segments[n].id] = counter;
            }
        }
    }
    //console.log(arrmap);

    // Create text string
    var newText1 = parsedData1.beforeSegments || '';
    for (let n = 0; n < parsedData1.segments.length; n++) {
        newText1 += String(arrmap[parsedData1.segments[n].id]) + '/' + parsedData1.segments[n].value;
    }
    var newText2 = parsedData2.beforeSegments || '';
    for (let n = 0; n < parsedData2.segments.length; n++) {
        newText2 += arrmap[parsedData2.segments[n].id] + '/' + parsedData2.segments[n].value;
    }

    return [newText1, newText2];
}

// Gets current segment from text current position
function getCurrentSegment(obj) {
    //obj.focus();
    let pos = $(obj).prop('selectionStart');
    let text = $(obj).val();
    console.log('getCurrentSegment', $(obj).attr('id'), pos);


    let number = null;
    let [preText, postText] = [text.substring(0, pos), text.substring(pos)];

    const regexTag = /(\d+)(?:\/)/g;
    let nextTagPos = postText.search(regexTag);
    if (pos == 0) {
        if (nextTagPos == 0) { // preText = ''

            /*             let match = segmentRegex.exec(text);
                        if (match === null) return null;
                        return {
                            start: 0,
                            index: match[1],
                            value: postText.substring(segmentRegex.lastIndex, nextTagPos)
                        }; */

            // ????????
            function regexIndexOf(text, re, i) {
                var indexInSuffix = text.slice(i).search(re);
                return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
            }

            let array1;
            if ((array1 = regexTag.exec(text)) !== null) {

                nextTagPos = regexIndexOf(text, regexTag, regexTag.lastIndex);

                console.log(`tag ${array1[1]} from ${regexTag.lastIndex}-${nextTagPos}.`);
                return {
                    start: 0,
                    index: array1[1],
                    value: postText.substring(regexTag.lastIndex, nextTagPos)
                };
            }
        } else {
            return null;
        }

    } else {
        let prePart = prePartRegex.exec(preText);
        if (prePart === null) return null;

        if (nextTagPos == -1) {
            var newText = prePart[2] + postText;
        } else {
            var newText = prePart[2] + postText.substring(0, nextTagPos); // shrink text selection
        }

        return {
            start: prePart.index,
            index: prePart[1],
            value: newText
        };
    }


}
// #endregion






function setTexts(text1, text2) {
    $('#input1').val(text1);
    $('#input2').val(text2);
    update();
}

function sortArrays() {
    let pos1 = $('#input1').prop('selectionStart');
    let data1 = $('#input1').val();
    let parsedText1 = parseData(data1);

    let pos2 = $('#input2').prop('selectionStart');
    let data2 = $('#input2').val();
    let parsedText2 = parseData(data2);

    let newTexts = orderMapping(parsedText1, parsedText2);
    setTexts(newTexts[0], newTexts[1]);

    // Re-establish cursor position
    $('#input1').prop('selectionStart', pos1).prop('selectionEnd', pos1);
    $('#input2').prop('selectionStart', pos2).prop('selectionEnd', pos2);
}

// for external iframes
let updateCallbackFunction = function () { };
function setupdateFunction(callbackFunction) {
    updateCallbackFunction = callbackFunction;
}

function updateGloss() {
    let $obj = $('#output_area');

    if ($('#cUseGlosses').prop('checked')) {
        $obj.addClass('glossed');
    } else {
        $obj.removeClass('glossed');
    }

    updateCallbackFunction();
}



function update() {
    let text1 = $('#input1').val();
    let text2 = $('#input2').val();

    // var useGloss = $('#cUseGlosses').prop('checked') ? 'glossed' : '';

    let html = '';
    let c1 = CreateGroups(text1, text2);
    let c2 = CreateGroups(text2, text1);
    console.log(c1);
    console.log(c2);
    console.log(Math.max(c1.length, c2.length));

    // Create tables
    for (let n = 0; n < Math.max(c1.length, c2.length); n++) {
        let cols = ['', ''];
        if (n < c1.length) cols[0] = c1[n].replace(/\n/, '<bSSSSSSSSSSSSSSr>');
        if (n < c2.length) cols[1] = c2[n];
        // .replace(newLineRegex, '<br>')
        console.log(cols);
        html += `<div><div>${c1[n]}</div><div>${c2[n]}</div></div>`;
    }

    $('#output_area').html(html);

    /*     $('#output_area').html(
            `<div>
                <div>${c1.join("</div><div>")}</div>
                <div>${c2.join("</div><div>")}</div>
            </div>`); 
        if (n >= c1.length) {
            html += `<div><div></div><div>${c2[n]}</div></div>`;
        } else if (n >= c2.length) {
            html += `<div><div>${c1[n]}</div><div></div></div>`;
        } else { // both are defined
            html += `<div><div>${c1[n]}</div><div>${c2[n]}</div></div>`;
        }            
            
            */

    // Prepare files to save
    hyperlinkDownload('saveFile1', fileName1, text1, 'text/plain');
    hyperlinkDownload('saveFile2', fileName2, text2, 'text/plain');

    updateGlosses();
    updateCallbackFunction();
}



function CreateGroups(data1, data2) {
    let parsedData1 = parseData(data1);
    let parsedData2 = parseData(data2);


    function spanHtml(text, id, color, gloss) {
        return spanHtmlRuby(text, id, color, gloss);
        let s1 = spanHtml1(text, id, color, gloss);
        let s2 = spanHtmlRuby(text, id, color, gloss);
        return s1 + s2;
    }

    function spanHtml1(text, id, color, gloss) {
        if (gloss) {
            if (color) {
                return `<div class="glossed"><div class="gloss">${gloss}</div><div class="content" style="background-color: ${color};">${text}</div></div>`;
            } else {
                return `<div class="glossed"><div class="gloss">${gloss}</div><div class="content">${text}</div></div>`;
            }
        } else {
            if (color) {
                return `<span style="background-color: ${color};">${text}</span>`;
            } else {
                return `<span>${text}</span>`;
            }
        }

    }
    function spanHtmlRuby(text, id, color, gloss) {
        if (gloss) {
            var inside = `<ruby>${text}<rt>${gloss}</rt></ruby>`;
        } else {
            var inside = text;
        }

        if (color) {
            return `<span id="segment${id}" style="background-color: ${color};">${inside}</span>`;
        } else {
            return `<span id="segment${id}">${inside}</span>`;
        }
    }


    var useColor = $('#cColors').prop('checked');
    var forceColor = $('#cForceColors').prop('checked');

    /* CHUNKS
    \n <- prose
    \n\n <- verse 
    - unset
    */
    let htmlChunks = [];
    console.log(parsedData1.segments.map(x => x.value));
    // unassigned segment
    htmlChunks.push(`<span>${parsedData1.beforeSegments.replace(newLineRegex, '<br>')}</span>`);
    let html = ''
    for (let n = 0; n < parsedData1.segments.length; n++) {
        let item = parsedData1.segments[n];

        let gloss = '';
        // compile glosses
        let glosses = parsedData2.segments.filter(x => x.id == item.id).map(x => x.value);
        // If glosses are discontinous join them
        if (glosses.length > 0) {
            gloss = glosses.join(' ').replace(newLineRegex, ' ').trim();
        }

        let color = null;
        if (forceColor || (useColor && glosses.length > 0)) {
            color = backcolors[item.id % backcolors.length];
        }
        /*
        Si un segmento está distribuido en varias líneas
        GLOSAS
        FILAS 
        \n al final de segmento -> <div>
        \n entre segmento -> <br>
        */

        var sel = $("#sGroup").find(":selected").text();
        if (sel == 'No grouping') {
            htmlChunks[htmlChunks.length - 1] += spanHtml(item.value, item.id, color, gloss);
        } else {
            if (sel == 'group paragraphs') {
                const paragraphSeparator = /(?:\r\n|[\n\v\f\r\x85\u2028\u2029])/gm;
                var regexSeparator = paragraphSeparator;
            } else if (sel == 'group verses') {
                const verseSeparator = /(?:\r\n|[\n\v\f\r\x85\u2028\u2029]){2,}/gm;
                var regexSeparator = verseSeparator;
            }

            let parts = item.value.split(regexSeparator);
            if (parts.length == 1) {
                htmlChunks[htmlChunks.length - 1] += spanHtml(item.value, item.id, color, gloss);
            } else {
                console.log('parts >', parts)
                for (let n = 0; n < parts.length; n++) {
                    if (parts[n]) {
                        let sh = spanHtml(parts[n], item.id, color, gloss);
                        if (n == 0) {
                            htmlChunks[htmlChunks.length - 1] += sh  // append string to last element
                        } else {
                            htmlChunks.push(sh);  // create new element
                        }

                    } else {
                        htmlChunks.push('');
                    }
                    htmlChunks[htmlChunks.length - 1] += "<br>";

                }
                // alert(regexp);
            }

        }

        let mode = 0;
        if (mode == 0) {
        }
        // how to distribute glosses along multiple lines 
        // IMPORTANT: <ruby> does not render inner <br>

        let lines = item.value.split(newLineRegex);
        /*
        console.log(lines);
        if (lines.length < 2) {
            html += spanHtml(lines[0], item.id, color, gloss);
        } else {
            let mode = 0;
            if (mode == 0) {
                for (let n = 0; n < lines.length; n++) {
                    if (n > 0) gloss = '';
                    if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, gloss);
                    // if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, null);
                }
                htmlChunks.push(...lines);            
            } else if (mode == 1) {
                for (let n = 0; n < lines.length; n++) {
                    if (n > 0) gloss = '';
                    if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, gloss);
                    // if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, null);
                }
                htmlChunks.push(...lines);
            } else {
                // count & remove final newlines. They will create rows
                let p = 0;
                while (lines.slice(-1) == '') {
                    p++;
                    lines.pop();
                }
                console.log(p);

                for (let n = 0; n < lines.length; n++) {
                    if (n > 0) gloss = '';
                    if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, gloss);
                    // if (lines[n].trim()) lines[n] = spanHtml(lines[n], item.id, color, null);
                }
                html += lines.join("<br>");

                while (p > 0) {
                    if (html == '') {
                        htmlChunks.push("<br>");
                    } else {
                        htmlChunks.push(html);
                    }

                    html = '';
                    p--;
                }
            }
        }
        */
        // htmlChunks.push();
    }
    htmlChunks.push(html);
    return htmlChunks;
}



function updateGlosses() {

    $(".glossed").each(function (index) {
        /*
        g > c separar en líneas 
        g < c

        */
        let $g = $(this).find(".gloss");
        let $c = $(this).find(".content");
        let widthG = $g.width();
        let widthC = $c.width();
        if (widthG > widthC * 1.5) {
            $g.addClass('justified');
            $c.width(widthG);

        } else if (widthG > widthC) {
            $g.addClass('justified');
        } else {
            $g.width(widthC);
        }


        return;
        $(this).width(width2);
        // $(this).find(".gloss").width("100%")
        console.log(index + ": " + $(this).find(".content").width());

    });
}