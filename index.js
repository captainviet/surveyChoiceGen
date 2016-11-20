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
        // number of rows
        const row = 10;
        // division's length
        const colSpan = 35;
        // ball's radius
        const radius = colSpan / 3;
        // number of division
        const step = row + 1;
        // image's size (width, height)
        const imageSize = step * colSpan;
        // border thickness
        const thickness = 3;
        // define color
        const p = new PNGlib(imageSize, imageSize, 256);
        let colorCode = this.colorPalette["transparent"];
        const background = p.color(colorCode.r, colorCode.g, colorCode.b, colorCode.a); // set the background transparent


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

        const template = '<div class="choice-item"><img src="' + imageSrc + '" alt=""><div class="caption"><table class="info" border="1"><tbody><tr><th>Chance</th><th>You Win</th></tr><tr><td class="inline-image"><img src="' + color1Src + '" alt="">&nbsp;' + ratio + '%</td><td>$' + color1Price + '</td></tr><td class="inline-image"><img src="' + color2Src + '" alt="">&nbsp;' + (100 - ratio) + '%</td><td>$' + color2Price + '</td></tr></tbody></table></div></div>';

        return template;
    },
    process(generator, ratio, opts) {
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
        // this.schema = {
        //     A: {
        //         purple: {
        //             perce: workbook.Sheets[sheetName].D1.h,
        //             price: workbook.Sheets[sheetName].F1.h,
        //         },
        //         orange: {
        //             perce: workbook.Sheets[sheetName].E1.h,
        //             price: workbook.Sheets[sheetName].G1.h,
        //         },
        //     },
        //     B: {
        //         purple: {
        //             perce: workbook.Sheets[sheetName].H1.h,
        //             price: workbook.Sheets[sheetName].J1.h,
        //         },
        //         orange: {
        //             perce: workbook.Sheets[sheetName].I1.h,
        //             price: workbook.Sheets[sheetName].K1.h,
        //         },
        //     },
        // }
        this.schema = {
            A1K: workbook.Sheets[sheetName].D1.h,
            A1V: workbook.Sheets[sheetName].F1.h,
            A2V: workbook.Sheets[sheetName].G1.h,
            B1K: workbook.Sheets[sheetName].H1.h,
            B1V: workbook.Sheets[sheetName].J1.h,
            B2V: workbook.Sheets[sheetName].K1.h,
        }
        console.log(this.schema);
        return result;
    },
}

$(function () {

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

        console.log(generator, typeof (ratio), opts);
        ImageProcessor.process(generator, ratio, opts);

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
        } else {
            // hide price
            $(".xlsx-collector").css("display", "none");
        }
    });

    const drop = $(".xlsx-collector").get(0);

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log("handle triggered");
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
                console.log(workbook);
                let json = ExcelProcessor.toJSON(workbook);
                const sheetName = workbook.SheetNames[0];
                const dataSheet = json[sheetName];

                const filepath = "res/data.json";
                const file = new File([""], filepath);
                const str = JSON.stringify(dataSheet);
                file.open("w");
                file.write(str);
                file.close();
                // // let miniSheet = dataSheet.slice(0, 5);
                // // console.log(miniSheet);
                // const schema = ExcelProcessor.schema;
                // dataSheet.forEach(function (row, i) {
                //     let containerId = "container" + i;
                //     let container = '<div class="container-fluid choice" id="' + containerId + '">'
                //     $("body").append(container);
                //     let choiceId = "choice" + i;
                //     let wrapper = '<div id="' + choiceId + '">';
                //     $("#" + containerId).append(wrapper);
                //     let ratio1 = row[schema.A1K];
                //     let purple1 = row[schema.A1V];
                //     let orange1 = row[schema.A2V];
                //     let ratio2 = row[schema.B1K];
                //     let purple2 = row[schema.B1V];
                //     let orange2 = row[schema.B2V];
                //     if (ratio1.indexOf("%") > -1) {
                //         ratio1 = ratio1.slice(0, ratio1.length - 1);
                //     }
                //     if (ratio2.indexOf("%") > -1) {
                //         ratio2 = ratio2.slice(0, ratio2.length - 1);
                //     }
                //     console.log(ratio1, purple1, orange1, ratio2, purple2, orange2);
                //     let choiceA = ImageProcessor.choiceGen(ratio1, purple1, orange1);
                //     let choiceB = ImageProcessor.choiceGen(ratio2, purple2, orange2);
                //     $("#" + choiceId).append(choiceA);
                //     $("#" + choiceId).append(choiceB);
                //     let filename = [i + 1, ratio1, purple1, orange1, ratio2, purple2, orange2].join("-");
                //     console.log("filename:", filename);
                //     html2canvas($("#" + choiceId), {
                //         onrendered: canvas => {
                //             setTimeout(() => {
                //                 Canvas2Image.saveAsPNG(canvas, filename);
                //                 console.log("Downloaded", choiceId);
                //                 $("#" + containerId).remove();
                //             }, i * 200);
                //             // $("#canvas").append(canvas);
                //         }
                //     });
                // })
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