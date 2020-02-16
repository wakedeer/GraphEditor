//drawing parameters
const CIRCLE_RADIUS_SIZE = 50;
const CRITICAL_PATH_CIRCLE_COLOR = '#fff61c';
const CIRCLE_COLOR = '#C2185B';
const CANDIDATE_CIRCLE_COLOR = '#b4ff47';
const CONNECTOR_COLOR = '#2a88c9';
const TEXT_COLOR = '#000000';

//svg size
const svgHeight = 700;
const svgWight = "100%";

//Data
var counterArr = [-1, -1, -1, -1];
var candidateNodeArr = [null, null, null, null];
var worksArr = [[], [], [], []];
var statesArr = [[], [], [], []];
var svgArr = [
    SVG('stage-0').size(svgWight, svgHeight),
    SVG('stage-1').size(svgWight, svgHeight),
    SVG('stage-2').size(svgWight, svgHeight),
    SVG('stage-3').size(svgWight, svgHeight)
];

function recountNodes(index, nodeNumber) {
    $("#stage-" + index).find('.node-number').each(function () {
        let currentValue = $(this).html();
        if (nodeNumber < currentValue) {
            $(this).html(--currentValue);
            $(this).parent().find("circle").attr("data-node-num", currentValue)
        }
    });
}

function recalculateWorks(nodeNumber) {
    return function (work) {
        if (work.source > nodeNumber) {
            work.source--;
        }
        if (work.target > nodeNumber) {
            work.target--;
        }
    };
}

function removeNeighborsWorks(nodeNumber) {
    return function (work) {
        if (work.source == nodeNumber || work.target == nodeNumber) {
            $('#' + work.id).remove();
            return false;
        } else {
            return true;
        }
    };
}

function drawNodeElements(node, currentNodeNumber) {
    node.circle(CIRCLE_RADIUS_SIZE)
        .fill(CIRCLE_COLOR)
        .attr("data-node-num", currentNodeNumber)
        .opacity(0.8);

    node.plain(currentNodeNumber)
        .attr("class", "node-number")
        .font({fill: TEXT_COLOR, family: 'Inconsolata'});
}

function findDuplicated(works, previousValue, currentValue) {
    return works.some(function (work) {
        return work.source == previousValue && work.target == currentValue;
    });
}

function enableOnlyCalculationBtn(index) {
    let validationBtn = $("#validation-btn-" + index);
    let calcBtn = $("#calculate-btn-" + index);
    validationBtn.removeClass("visible");
    validationBtn.addClass("invisible");
    calcBtn.removeClass("invisible");
    calcBtn.addClass("visible");
}

function enableOnlyValidationBtn(index) {
    let validationBtn = $("#validation-btn-" + index);
    let calcBtn = $("#calculate-btn-" + index);
    validationBtn.removeClass("invisible");
    validationBtn.addClass("visible");
    calcBtn.removeClass("visible");
    calcBtn.addClass("invisible");
}

function validation(counter, works, states, index) {
    for (let i = 0; i <= counter; i++) {
        let previous = [];
        let next = [];
        works.forEach(function (work) {
            if (i == work.target) {
                previous.push(work.source);
            }
            if (i == work.source) {
                next.push(work.target);

            }
        });
        states.push({id: i, prev: previous, next: next})
    }
    let msg = "";
    states.forEach(function (state) {
        if (state.id == 0 && (state.prev.length > 0 || state.next.length == 0)) {
            msg += "Состояние <strong>0</strong> не начальное! </br>";
        }
        if (state.id == counter && (state.next.length > 0 || state.prev.length == 0)) {
            msg += "Состояние <strong>" + counter + "</strong> не конечное!</br>";
        }
        if (state.id > 0 && state.id < counter && (state.next.length == 0 || state.prev.length == 0)) {
            msg += "Состояние  <strong>" + state.id + "</strong> не промежуточное!</br>";

        }
    });
    if (counter < 0) {
        showAlert("Нарисуйте ниже сетевую модель", "alert-warning", index)
    } else if (msg.length == 0) {
        let tableHtml = "";
        works.forEach(function (work) {
            tableHtml += "<tr><td class='table-info'>" + work.source + "</td><td class='table-info'>" + work.target + "</td><td data-work-id='" + work.id + "'contenteditable='true'" +
                (work.time ? "class='table-success'>" + work.time : ">") + "</td></tr>";
        });
        $("#work-table-" + index).html(tableHtml);
        showAlert("Сетевая модель валидна. В таблицу работ введите длительности", "alert-success", index)
        enableOnlyCalculationBtn(index);
    } else {
        showAlert(msg, "alert-danger", index);
    }
}

function showAlert(text, type, index) {
    let alert = $("#message-alert-" + index);
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "block");
    $("#message-alert-text-" + index).html(text);
    alert.addClass(type);
}

function hideAlert(index) {
    let alert = $("#message-alert-" + index);
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "none");
}

function storeWorks(index) {
    worksArr[index].forEach(function (work) {
        let cell = $("#work-table-" + index).find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        }
    });
}

function calculate(works, index, states) {
    for (let i = 0; i < works.length; i++) {
        let work = works[i];
        let cell = $("#work-table-" + index).find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        } else {
            $(cell).addClass("table-danger");
            showAlert("В таблице работ заполнены не все длительности!", "alert-danger", index);
            return;
        }
    }

    //create table
    for (let i = 0; i < states.length; i++) {
        let tp = 0;
        states[i].tp = tp;
        if (i > 0) {
            states[i].prev.forEach(function (prev) {
                let element = works.find(function (work) {
                    return work.source == prev && work.target == i
                });
                tp = states[prev].tp + element.time;
                if (states[i].tp < tp) {
                    states[i].tp = tp;
                }
            });
        }
    }

    let msg = "";
    let criticalPath = states[states.length - 1].tp;
    for (let i = states.length - 1; i >= 0; i--) {
        let tn = 0;
        states[i].tn = criticalPath;
        if (i < states.length - 1) {
            states[i].next.forEach(function (next) {
                let element = works.find(function (work) {
                    return work.source == i && work.target == next
                });
                tn = states[next].tn - element.time;
                if (states[i].tn > tn) {
                    states[i].tn = tn;
                }
            });
        }
        states[i].r = states[i].tn - states[i].tp;
        if (states[i].r == 0) {
            $("#stage-" + index).find("circle[data-node-num='" + i + "']").attr("fill", CRITICAL_PATH_CIRCLE_COLOR);
            msg = "-" + i + msg;
        } else {
            $("#stage-" + index).find("circle[data-node-num='" + i + "']").attr("fill", CIRCLE_COLOR);
        }
    }

    //fill states table
    let statesTableHtml = "";
    states.forEach(function (state) {
        statesTableHtml += '<tr><th scope="row">' + state.id + '</th><td>' + state.prev + '</td><td>' + state.next + '</td><td>' + state.tp + '</td><td>' + state.tn + '</td><td>' + state.r + '</td></tr>';
    });

    $("#states-table-" + index).html(statesTableHtml);

    showAlert("Критический путь " + msg + "  равен " + criticalPath, "alert-warning", index)

    let criticalPathCell = $(".critical-path-" + index);
    criticalPathCell.text(criticalPath);
    criticalPathCell.removeClass("table-danger");
    $("table.performance-indicator").find("td").empty();
}

$(".work-table").on("keypress", "td[data-work-id]", function (e) {
    var keyCode = e.which ? e.which : e.keyCode;
    if (!(keyCode >= 48 && keyCode <= 57)) {
        return false;
    } else {
        $(this).removeClass("table-danger");
        $(this).addClass("table-success");
    }
});

$(".svg-stage").mousedown(function () {
    let index = $(this).attr("data-index");
    enableOnlyValidationBtn(index);
});

function getIntensities(index) {
    let intens = [];
    let hasErrors = false;
    $("table.critical-path-table-" + index).find("td").each(function () {
        let value = $(this).text();
        if (!value) {
            $(this).addClass("table-danger");
            hasErrors = true;
            return;
        }
        intens.push(1 / value);
    });
    return {intens, hasErrors};
}

function fillIntensitiesResults(index, p) {
    let indicatorCells = $("#performance-indicator-" + index).find("td");
    $.each(p, function (i, val) {
        $(indicatorCells[i]).text(Number.parseFloat(val).toFixed(2));
    })
}

$("#calculate-performance-0").click(function () {
    let index = "0";

    let {intens, hasErrors} = getIntensities(index);
    if (hasErrors) {
        return;
    }

    let p = [];
    let znam = intens[0] * (intens[0] + intens[1] + intens[2]) + intens[1] * intens[2];
    p.push(intens[1] * intens[2] / znam * 100);
    p.push(intens[0] * intens[2] * (intens[0] + intens[1] + intens[2]) / znam / (intens[1] + intens[2]) * 100);
    p.push(intens[0] * intens[1] / znam * 100);
    p.push(intens[0] * intens[0] * intens[1] / znam / (intens[1] + intens[2]) * 100);

    fillIntensitiesResults(index, p);
});

$("#calculate-performance-1").click(function () {
    let index = "1";

    let {intens, hasErrors} = getIntensities(index);

    if (hasErrors) {
        return;
    }

    let p = [];
    let znam = intens[0] * (intens[0] + intens[1] + intens[2]) + intens[1] * intens[2];
    p.push(intens[1] * intens[2] / znam * 100);
    p.push(intens[0] * intens[2] * (intens[0] + intens[1] + intens[2]) / znam / (intens[1] + intens[2]) * 100);
    p.push(intens[0] * intens[1] / znam * 100);
    p.push(intens[0] * intens[0] * intens[1] / znam / (intens[1] + intens[2]) * 100);

    fillIntensitiesResults(index, p);
});




$(svgArr).each(function (index) {
    this.dblclick(function (evt) {
        let e = evt.target;
        let dim = e.getBoundingClientRect();
        let x = evt.clientX - dim.left;
        let y = evt.clientY - dim.top;

        const nodesOne = svgArr[index].group();
        let node = nodesOne.group().translate(x, y).draggy();

        let currentNodeNumber = ++counterArr[index];

        drawNodeElements(node, currentNodeNumber);

        node.on('contextmenu', function () {
            let nodeNumber = $(this.node).find('text').html();
            this.remove();
            worksArr[index] = $.grep(worksArr[index], removeNeighborsWorks(nodeNumber));

            //removing countdown
            worksArr[index].forEach(recalculateWorks(nodeNumber));
            recountNodes(index, nodeNumber);
            counterArr[index]--;
        });

        node.click(function () {
            if (candidateNodeArr[index] === this) {
                this.children()[0].fill({color: CIRCLE_COLOR});
                candidateNodeArr[index] = null;
            } else if (candidateNodeArr[index]) {

                let currentValue = this.children()[1].node.textContent;
                let previousValue = candidateNodeArr[index].children()[1].node.textContent;

                let works = worksArr[index];
                let isAlreadyExist = findDuplicated(works, previousValue, currentValue);

                if (currentValue < previousValue) {
                    showAlert("Переход из большего в меньшее не возможен!", "alert-danger", index);
                } else if (isAlreadyExist) {
                    showAlert("Дублирующий переход из состояния " + previousValue + " в состояние " + currentValue + " не возможен!", "alert-danger", index);
                } else {
                    let connectable = candidateNodeArr[index].connectable({
                        marker: 'default',
                        targetAttach: 'perifery',
                        sourceAttach: 'perifery',
                        color: CONNECTOR_COLOR
                    }, this);

                    let connectorId = $(connectable.connector.node).attr("id");
                    //remove work
                    connectable.connector.attr("stroke-width", 1.5);

                    connectable.connector.on('contextmenu', function () {
                        let connectorId = this.id();
                        worksArr[index] = $.grep(worksArr[index], function (work) {
                            return work.id !== connectorId;
                        });
                        this.remove();
                    });
                    works.push(
                        {
                            id: connectorId,
                            source: parseInt(previousValue, 10),
                            target: parseInt(currentValue, 10)
                        }
                    );
                    this.children()[0].fill({color: CIRCLE_COLOR});
                    candidateNodeArr[index].children()[0].fill({color: CIRCLE_COLOR});
                    candidateNodeArr[index] = null;
                }
            } else {
                candidateNodeArr[index] = this;
                candidateNodeArr[index].children()[0].fill({color: CANDIDATE_CIRCLE_COLOR})
            }
        });
    });
});

$(".validation-btn").click(function () {
    let index = $(this).attr("data-index");
    statesArr[index] = [];
    validation(counterArr[index], worksArr[index], statesArr[index], index);
});

$(".alert-close-btn").click(function (e) {
    let index = $(this).attr("data-index");
    hideAlert(index);
});

$(".calculate-btn").click(function (e) {
    let index = $(this).attr("data-index");
    calculate(worksArr[index], index, statesArr[index]);
});

$(".work-table").on('blur', "td[data-work-id]", function (e) {
    let index = $(this).parent().parent().attr("data-index");
    storeWorks(index);
});

