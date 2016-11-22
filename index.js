const ImageProcessor = {
    colorPalette: {
        "transparent": { r: 0, g: 0, b: 0, a: 0 },
        "black": { r: 0, g: 0, b: 0, a: 1 },
        "red": { r: 255, g: 0, b: 0, a: 1 },
        "green": { r: 0, g: 255, b: 0, a: 1 },
        "blue": { r: 0, g: 0, b: 255, a: 1 },
        "purple": { r: 128, g: 0, b: 128, a: 1 },
        "yellow": { r: 255, g: 255, b: 0, a: 1 },
        "orange": { r: 255, g: 165, b: 0, a: 1 },
    },
    ballboxGen(ratio) {
        const row = 10;
        const colSpan = 35;
        const radius = colSpan / 3;
        const step = row + 1;
        const imageSize = step * colSpan;
        const thickness = 3;
        const p = new PNGlib(imageSize, imageSize, 256);
        let colorCode = this.colorPalette["transparent"];
        const background = p.color(colorCode.r, colorCode.g, colorCode.b, colorCode.a);


        let count = 0;
        colorCode = this.colorPalette["purple"];
        let color = p.color(colorCode.r, colorCode.g, colorCode.b);
        for (let x = colSpan; x < imageSize; x += colSpan) {
            for (let y = colSpan; y < imageSize; y += colSpan) {
                if (count >= Math.floor(ratio * Math.pow(row, 2))) {
                    colorCode = this.colorPalette["orange"];
                    color = p.color(colorCode.r, colorCode.g, colorCode.b);
                }
                for (let i = 0; i < 2 * Math.PI; i += 0.01) {
                    for (let t = 0; t <= 1; t += 0.01) {
                        p.buffer[p.index(Math.floor(x + t * radius * Math.sin(i)), Math.floor(y + t * radius * Math.cos(i)))] = color;
                    }
                }
                count++;
            }
        }
        colorCode = this.colorPalette["black"];
        color = p.color(colorCode.r, colorCode.g, colorCode.b);
        for (let i = 0; i < thickness; i++) {
            for (let j = 0; j < imageSize; j++) {
                p.buffer[p.index(i, j)] = color;
                p.buffer[p.index(i + imageSize - thickness, j)] = color;
            }
        }
        for (let i = 0; i < imageSize; i++) {
            for (let j = 0; j < thickness; j++) {
                p.buffer[p.index(i, j)] = color;
                p.buffer[p.index(i, j + imageSize - thickness)] = color;
            }
        }

        return p;
    },
    squareGen(color) {
        const imageSize = 20;
        const p = new PNGlib(imageSize, imageSize, 256);
        let colorCode = this.colorPalette[color];
        if (colorCode == null) {
            colorCode = p.color(255, 255, 255);
        }
        const background = p.color(colorCode.r, colorCode.g, colorCode.b);
        return p;
    },
    downloadSrc(format, source, filename) {
        const dataURI = 'data:' + format + source;
        const download = document.createElement('a');
        download.href = dataURI;
        download.download = filename;
        download.click();
    },
    show(p) {
        $(".image").append('<img src="data:image/png;base64,' + p.getBase64() + '">');
    },
    choiceGen(ratio, color1Price, color2Price) {
        const square1 = this.squareGen("purple");
        const color1Src = 'data:image/png;base64,' + square1.getBase64();
        const square2 = this.squareGen("orange");
        const color2Src = 'data:image/png;base64,' + square2.getBase64();
        const p = this.ballboxGen(ratio / 100);
        const imageSrc = 'data:image/png;base64,' + p.getBase64();

        let row1 = '';
        let row2 = '';
        if (ratio > 0) {
            row1 = '<tr><td class="inline-image"><img src="' + color1Src + '" alt="">&nbsp;' + ratio + '%</td><td>$' + color1Price + '</td></tr>';
        }
        if (ratio < 100) {
            row2 = '<tr><td class="inline-image"><img src="' + color2Src + '" alt="">&nbsp;' + (100 - ratio) + '%</td><td>$' + color2Price + '</td></tr>';
        }

        const template = '<div class="choice-item"><img src="' + imageSrc + '" alt=""><div class="caption"><table class="info" border="1"><tbody><tr><th>Chance</th><th>You Win</th></tr>' + row1 + row2 + '</tbody></table></div></div>';

        return template;
    },
    process(generator, ratio, opts) {
        if (generator == 3) {
            const start = ExcelProcessor.index;
            const end = start + 10;
            const json = ExcelProcessor.json;
            const schema = ExcelProcessor.schema;
            for (let i = start; i < end; i++) {
                if (i > ExcelProcessor.end) {
                    break;
                }
                let row = json[i];
                let containerId = "container" + i;
                let container = '<div class="container-fluid choice" id="' + containerId + '">'
                $("body").append(container);
                let choiceId = "choice" + i;
                let choice = '<div id="' + choiceId + '">';
                $("#" + containerId).append(choice);
                let ratio1 = row[schema.A1K];
                let purple1 = row[schema.A1V];
                let orange1 = row[schema.A2V];
                let ratio2 = row[schema.B1K];
                let purple2 = row[schema.B1V];
                let orange2 = row[schema.B2V];
                if (ratio1.indexOf("%") > -1) {
                    ratio1 = ratio1.slice(0, ratio1.length - 1);
                }
                if (ratio2.indexOf("%") > -1) {
                    ratio2 = ratio2.slice(0, ratio2.length - 1);
                }
                let choiceA = ImageProcessor.choiceGen(ratio1, purple1, orange1);
                let choiceB = ImageProcessor.choiceGen(ratio2, purple2, orange2);
                $("#" + choiceId).append(choiceA);
                $("#" + choiceId).append(choiceB);
                let filename = [i + 1, ratio1, purple1, orange1, ratio2, purple2, orange2].join("-");
                console.log("filename:", filename);
                html2canvas($("#" + choiceId), {
                    onrendered: canvas => {
                        setTimeout(() => {
                            Canvas2Image.saveAsPNG(canvas, filename);
                            console.log("Downloaded", choiceId);
                            $("#" + containerId).remove();
                        }, i * 200);
                    }
                });
                ExcelProcessor.updateIndex(i);
            }
            return;
        }
        if (generator == 2) {
            const purplePrice = opts.purplePrice;
            const orangePrice = opts.orangePrice;
            let choiceImg = null;
            if (ratio == "") {
                for (let num = 0; num <= 50; num += 5) {
                    choiceImg = this.choiceGen(num, purplePrice, orangePrice);
                    this.downloadSrc("text/html;charset=utf-8,", choiceImg, "choice-" + num + ".html");
                    $(".choice").append(choiceImg);
                }
            } else {
                choiceImg = this.choiceGen(ratio, purplePrice, orangePrice);
                $(".choice").append(choiceImg);
            }
            return;
        }
        if (ratio.indexOf(",") > 0) {
            const ratioArray = ratio.split(",");
            const This = this;
            if (generator == 0) {
                ratioArray.forEach(function (ratio) {
                    const p = This.ballboxGen(ratio / 100);
                    This.downloadSrc("image/png;base64,", p.getBase64(), "ballbox.png");
                    if (opts.isShowImage) {
                        This.show(p);
                    }
                });
                return;
            }
            if (generator == 1) {
                ratioArray.forEach(function (color) {
                    const p = This.squareGen(color);
                    This.downloadSrc("image/png;base64,", p.getBase64(), color + ".png");
                    if (opts.isShowImage) {
                        This.show(p);
                    }
                });
                return;
            }
        } else {
            let p = null;
            if (generator == 0) {
                p = this.ballboxGen(ratio / 100);
                this.downloadSrc("image/png;base64,", p.getBase64(), "ballbox.png");
            } else if (generator == 1) {
                p = this.squareGen(ratio);
                this.downloadSrc("image/png;base64,", p.getBase64(), ratio + ".png");
            }
            if (opts.isShowImage) {
                this.show(p);
            }
        }
    },
};

const ExcelProcessor = {
    json: {},
    index: 0,
    end: 0,
    schema: {},
    toJSON(workbook) {
        let result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (roa.length > 0) {
                result[sheetName] = roa;
            }
        });
        const sheetName = workbook.SheetNames[0];
        this.schema = {
            A1K: workbook.Sheets[sheetName].D1.h,
            A1V: workbook.Sheets[sheetName].F1.h,
            A2V: workbook.Sheets[sheetName].G1.h,
            B1K: workbook.Sheets[sheetName].H1.h,
            B1V: workbook.Sheets[sheetName].J1.h,
            B2V: workbook.Sheets[sheetName].K1.h,
        }
        const dataSheet = result[sheetName];
        this.json = dataSheet;
    },
    updateIndex(index) {
        this.index = index;
    },
    updateEnd(end) {
        this.end = end;
    }
}

$(function () {

    automate = null;

    $(".submit").on("click", function () {
        let ratio = $(".ratio").val();
        $(".ratio").val(null);

        const generator = $("[name='function']:checked").val();

        const opts = {
            isShowImage: false,
            purplePrice: 0,
            orangePrice: 0,
        };

        if ($(".showImage").is(":checked")) {
            opts.isShowImage = true;
        };
        if ($(".price-collector").css("display") == "block") {
            opts.purplePrice = $(".price-1").val();
            opts.orangePrice = $(".price-2").val();
            $(".price-1").val(null);
            $(".price-2").val(null);
        }

        ImageProcessor.process(generator, ratio, opts);
    });

    $(".automate").on("click", function () {
        $(".abort").click();
        const start = $(".start").val();
        const end = $(".end").val();
        const amount = end - start + 1;
        // if start not lies within 1-json.length
        if (isNaN(start) || start <= 0 || (ExcelProcessor.json != {} && start > ExcelProcessor.json.length)) {
            $(".status").html("Invalid range!");
            $(".start").val("");
            return;
        }
        // if end not lies within start-json.length
        if (isNaN(end) || end < start || (ExcelProcessor.json != {} && end > ExcelProcessor.json.length)) {
            $(".status").html("Invalid range!");
            $(".end").val("");
            return;
        }
        // update ExcelProcessor data to normalized value
        ExcelProcessor.updateIndex(start - 1);
        ExcelProcessor.updateEnd(end - 1);
        console.log(start, end, ExcelProcessor);
        automate = setInterval(function () {
            $(".status").html((end - ExcelProcessor.index + 1) + "/" + amount + " Processing...");
            if (ExcelProcessor.index >= ExcelProcessor.end) {
                clearInterval(automate);
                $(".status").html(amount + "/" + amount + " Finished!");
            } else {
                $(".submit").click();
            }
        }, 60000);
    });

    $(".abort").on("click", function () {
        console.log(automate, ExcelProcessor);
        clearInterval(automate);
    })

    $("input:radio[name='function']").change(function () {
        if ($(this).is(":checked") && $(this).val() == "1") {
            // show square's label
            $(".square").css("display", "inline-block");
            $(".ballbox").css("display", "none");
        } else {
            // show ballbox's label
            $(".square").css("display", "none");
            $(".ballbox").css("display", "inline-block");
        }
    });

    $("input:radio[name='function']").change(function () {
        if ($(this).is(":checked") && $(this).val() == "2") {
            // show price
            $(".price-collector").css("display", "block");
        } else {
            // hide price
            $(".price-collector").css("display", "none");
        }
    });

    $("input:radio[name='function']").change(function () {
        if ($(this).is(":checked") && $(this).val() == "3") {
            // show price
            $(".xlsx-collector").css("display", "block");
            $(".ratio-collector").css("display", "none");
            $(".automate").css("display", "inline");
            $(".abort").css("display", "inline");
            $(".submit").css("display", "none");
        } else {
            // hide price
            $(".xlsx-collector").css("display", "none");
            $(".ratio-collector").css("display", "block");
            $(".automate").css("display", "none");
            $(".abort").css("display", "none");
            $(".submit").css("display", "inline");
        }
    });


    const drop = $(".xlsx-collector").get(0);

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log("Received xlsx file!");
        const files = e.dataTransfer.files;
        let i, f;
        for (i = 0, f = files[i]; i != files.length; ++i) {
            let reader = new FileReader();
            let name = f.name;
            reader.onload = function (e) {
                let data = e.target.result;

                /* if binary string, read with type 'binary' */
                let workbook = XLSX.read(data, { type: 'binary' });

                /* DO SOMETHING WITH workbook HERE */
                ExcelProcessor.toJSON(workbook);
                $(".start").val(1);
                $(".end").val(ExcelProcessor.json.length);
                const automate = setInterval(function () {
                    if (ExcelProcessor.index >= ExcelProcessor.json.length) {
                        clearInterval(automate);
                    } else {
                        $(".submit").click();
                    }
                }, 60000);

            };
            reader.readAsBinaryString(f);
        }
    };

    function handleDragover(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    if (drop.addEventListener) {
        drop.addEventListener('dragenter', handleDragover, false);
        drop.addEventListener('dragover', handleDragover, false);
        drop.addEventListener('drop', handleDrop, false);
    }



});

/*
    NOTE:
        - 
*/