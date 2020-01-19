//drawing parameters
const CIRCLE_RADIUS_SIZE = 50;
const CRITICAL_PATH_CIRCLE_COLOR = '#fff61c';
const CIRCLE_COLOR = '#C2185B';
const CANDIDATE_CIRCLE_COLOR = '#b4ff47';
const CONNECTOR_COLOR = '#2a88c9';
const TEXT_COLOR = '#000000';

//Data
var counterOne = -1;
var candidateNodeOne = null;
var worksOne = [];
var statesOne = [];

//SVG elements
var svgOne = SVG('stage-1').size("100%", 900);
var nodesOne = svgOne.group();

var svgTwo = SVG('stage-2').size("100%", 900);
var nodesTwo = svgTwo.group();

function recounterNodes(part, nodeNumber) {
    $("#stage-" + part).find('.node-number').each(function () {
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

function drowNodeElements(node, currentNodeNumber) {
    node.circle(CIRCLE_RADIUS_SIZE)
        .fill(CIRCLE_COLOR)
        .attr("data-node-num", currentNodeNumber)
        .opacity(0.8);

    node.plain(currentNodeNumber)
        .attr("class", "node-number")
        .font({fill: TEXT_COLOR, family: 'Inconsolata'});
}

function findDublicate(works, previousValue, currentValue) {
    return works.some(function (work) {
        return work.source == previousValue && work.target == currentValue;
    });
}

function createNode(evt) {
    let e = evt.target;
    let dim = e.getBoundingClientRect();
    let x = evt.clientX - dim.left;
    let y = evt.clientY - dim.top;
    let node = nodesOne.group().translate(x, y).draggy();
    return node;
}

svgOne.dblclick(function (evt) {
    let part = "1";

    let node = createNode(evt);

    let currentNodeNumber = ++counterOne;

    drowNodeElements(node, currentNodeNumber);

    node.on('contextmenu', function () {
        let nodeNumber = $(this.node).find('text').html();
        this.remove();
        worksOne = $.grep(worksOne, removeNeighborsWorks(nodeNumber));

        //removing countdown
        worksOne.forEach(recalculateWorks(nodeNumber));
        recounterNodes(part, nodeNumber);
        counterOne--;
    });

    node.click(function () {
        if (candidateNodeOne === this) {
            this.children()[0].fill({color: CIRCLE_COLOR});
            candidateNodeOne = null;
        } else if (candidateNodeOne) {

            let currentValue = this.children()[1].node.textContent;
            let previousValue = candidateNodeOne.children()[1].node.textContent;

            let works = worksOne;
            let isAlreadyExist = findDublicate(works, previousValue, currentValue);

            if (currentValue < previousValue) {
                showAlert("Переход из большего в меньшее не возможен!", "alert-danger", "1");
            } else if (isAlreadyExist) {
                showAlert("Дублирующий переход из состояния " + previousValue + " в состояние " + currentValue + " не возможен!", "alert-danger", "1");
            } else {
                let connectable = candidateNodeOne.connectable({
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
                    worksOne = $.grep(worksOne, function (work) {
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
                candidateNodeOne.children()[0].fill({color: CIRCLE_COLOR});
                candidateNodeOne = null;
            }
        } else {
            candidateNodeOne = this;
            candidateNodeOne.children()[0].fill({color: CANDIDATE_CIRCLE_COLOR})
        }
    });
});

function validation(counter, works, states, part) {
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

        states.push(
            {
                id: i,
                prev: previous,
                next: next
            }
        )
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
        showAlert("Нарисуйте ниже сетевую модель", "alert-warning", part)
    } else if (msg.length == 0) {
        let tableHtml = "";
        works.forEach(function (work) {
            tableHtml += "<tr><td class='table-info'>" + work.source + "</td><td class='table-info'>" + work.target + "</td><td data-work-id='" + work.id + "'contenteditable='true'" +
                (work.time ? "class='table-success'>" + work.time : ">") + "</td></tr>";
        });
        $("#work-table-1").html(tableHtml);
        showAlert("Сетевая модель валидна. В таблицу работ введите длительности", "alert-success", part)
    } else {
        showAlert(msg, "alert-danger", part);
    }
}

$("#validation-btn-1").click(function () {
    let part = "1";
    let counter = counterOne;
    let works = worksOne;
    statesOne = [];
    let states = statesOne;
    validation(counter, works, states, part);
});

function showAlert(text, type, part) {
    let alert = $("#message-alert-" + part);
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "block");
    $("#message-alert-text-" + part).html(text);
    alert.addClass(type);
}

function hideAlert(part) {
    let alert = $("#message-alert-" + part);
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "none");
}

$("#alert-close-btn-1").click(function (e) {
    let part = "1";
    hideAlert(part);
});

function calculate(works, part, states) {
    for (let i = 0; i < works.length; i++) {
        let work = works[i];
        let cell = $("#work-table-" + part).find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        } else {
            $(cell).addClass("table-danger");
            showAlert("В таблице работ заполнены не все длительности!", "alert-danger", "1");
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
    for (let i = states.length - 1; i >= 0; i--) {
        let tn = 0;
        states[i].tn = states[states.length - 1].tp;
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
            $("#stage-1").find("circle[data-node-num='" + i + "']").attr("fill", CRITICAL_PATH_CIRCLE_COLOR);
            msg = "-" + i + msg;
        } else {
            $("#stage-1").find("circle[data-node-num='" + i + "']").attr("fill", CIRCLE_COLOR);
        }
    }

    //fill states table
    let statesTableHtml = "";
    states.forEach(function (state) {
        statesTableHtml += '<tr><th scope="row">' + state.id + '</th><td>' + state.prev + '</td><td>' + state.next + '</td><td>' + state.tp + '</td><td>' + state.tn + '</td><td>' + state.r + '</td></tr>';
    });

    $("#states-table-1").html(statesTableHtml);

    showAlert("Критический путь " + msg + "  равен " + states[states.length - 1].tp, "alert-warning", "1")
}

$("#calculate-btn-1").click(function (e) {
    let part = "1", works = worksOne, states = statesOne;
    calculate(works, part, states);
});

function storeWorks(part) {
    worksOne.forEach(function (work) {
        let cell = $("#work-table-" + part).find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        }
    });
}

$("#work-table-1").on('blur', "td[data-work-id]", function (e) {
    storeWorks("1");
});

$(".work-table").on("keypress", "td[data-work-id]", function (e) {
    var keyCode = e.which ? e.which : e.keyCode;
    if (!(keyCode >= 48 && keyCode <= 57)) {
        return false;
    } else {
        $(this).removeClass("table-danger");
        $(this).addClass("table-success");
    }
});
