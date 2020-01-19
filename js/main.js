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

svgOne.dblclick(function (evt) {

    let e = evt.target;

    let dim = e.getBoundingClientRect();

    let x = evt.clientX - dim.left;
    let y = evt.clientY - dim.top;
    let currentNodeNumber = ++counterOne;

    var node = nodesOne.group().translate(x, y).draggy();

    node.circle(CIRCLE_RADIUS_SIZE)
        .fill(CIRCLE_COLOR)
        .attr("data-node-num", currentNodeNumber)
        .opacity(0.8);
    node.on('contextmenu', function () {
        let nodeNumber = $(this.node).find('text').html();
        this.remove();
        worksOne = $.grep(worksOne, function (work) {
            if (work.source == nodeNumber || work.target == nodeNumber) {
                $('#' + work.id).remove();
                return false;
            } else {
                return true;
            }
        });

        //removing countdown
        worksOne.forEach(function (work) {
                if (work.source > nodeNumber) {
                    work.source--;
                }
                if (work.target > nodeNumber) {
                    work.target--;
                }
            }
        );

        $("#stage-1").find('.node-number').each(function () {
            let currentValue = $(this).html();
            if (nodeNumber < currentValue) {
                $(this).html(--currentValue);
                $(this).parent().find("circle").attr("data-node-num",currentValue)
            }
        });
        counterOne--;
    });
    node.plain(currentNodeNumber)
        .attr("class", "node-number")
        .font({fill: TEXT_COLOR, family: 'Inconsolata'});
    node.click(function () {
        if (candidateNodeOne === this) {
            this.children()[0].fill({color: CIRCLE_COLOR});
            candidateNodeOne = null;
        } else if (candidateNodeOne) {
            let currentValue = this.children()[1].node.textContent;

            let previousValue = candidateNodeOne.children()[1].node.textContent;


            let isAlreadyExist = worksOne.some(function (work) {
                return work.source == previousValue && work.target == currentValue;
            });
            if (currentValue < previousValue) {
                showAlert("Переход из большего в меньшее не возможен!", "alert-danger");
            } else if (isAlreadyExist) {
                showAlert("Дублирующий переход из состояния " + previousValue + " в состояние " + currentValue + " не возможен!", "alert-danger");
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
                worksOne.push(
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
$("#validation-btn-1").click(function () {
    statesOne = [];
    for (let i = 0; i <= counterOne; i++) {
        let previous = [];
        let next = [];
        worksOne.forEach(function (work) {
            if (i == work.target) {
                previous.push(work.source);
            }
            if (i == work.source) {
                next.push(work.target);
            }

        });
        statesOne.push(
            {
                id: i,
                prev: previous,
                next: next
            }
        )

    }
    let msg = "";
    statesOne.forEach(function (state) {
        if (state.id == 0 && (state.prev.length > 0 || state.next.length == 0)) {
            msg += "Состояние <strong>0</strong> не начальное! </br>";

        }
        if (state.id == counterOne && (state.next.length > 0 || state.prev.length == 0)) {
            msg += "Состояние <strong>" + counterOne + "</strong> не конечное!</br>";

        }
        if (state.id > 0 && state.id < counterOne && (state.next.length == 0 || state.prev.length == 0)) {
            msg += "Состояние  <strong>" + state.id + "</strong> не промежуточное!</br>";
        }

    });
    if (counterOne < 0) {
        showAlert("Нарисуйте ниже сетевую модель", "alert-warning")
    } else if (msg.length == 0) {
        let tableHtml = "";
        worksOne.forEach(function (work) {
            tableHtml += "<tr><td class='table-info'>" + work.source + "</td><td class='table-info'>" + work.target + "</td><td data-work-id='" + work.id + "'contenteditable='true'" +
                (work.time ? "class='table-success'>" + work.time : ">") + "</td></tr>";
        });
        $("#work-table-1").html(tableHtml);
        showAlert("Сетевая модель валидна. В таблицу работ введите длительности", "alert-success")
    } else {
        showAlert(msg, "alert-danger");
    }

});
function showAlert(text, type) {
    let alert = $("#message-alert-1");
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "block");
    $("#message-alert-text-1").html(text);
    alert.addClass(type);

}
$("#alert-close-btn-1").click(function (e) {
    let alert = $("#message-alert-1");
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "none");

});
$("#calculate-btn-1").click(function (e) {
    for (let i = 0; i < worksOne.length; i++) {
        let work = worksOne[i];
        let cell = $("#work-table-1").find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        } else {
            $(cell).addClass("table-danger");
            showAlert("В таблице работ заполнены не все длительности!", "alert-danger");
            return;
        }
    }

//create table
    for (let i = 0; i < statesOne.length; i++) {
        let tp = 0;
        statesOne[i].tp = tp;
        if (i > 0) {
            statesOne[i].prev.forEach(function (prev) {
                let element = worksOne.find(function (work) {
                    return work.source == prev && work.target == i
                });
                tp = statesOne[prev].tp + element.time;
                if (statesOne[i].tp < tp) {
                    statesOne[i].tp = tp;
                }
            });
        }
    }

    var msg = "";
    for (let i = statesOne.length - 1; i >= 0; i--) {
        let tn = 0;
        statesOne[i].tn = statesOne[statesOne.length - 1].tp;
        if (i < statesOne.length - 1) {
            statesOne[i].next.forEach(function (next) {
                let element = worksOne.find(function (work) {
                    return work.source == i && work.target == next
                });
                tn = statesOne[next].tn - element.time;
                if (statesOne[i].tn > tn) {
                    statesOne[i].tn = tn;
                }
            });
        }
        statesOne[i].r = statesOne[i].tn - statesOne[i].tp;
        if (statesOne[i].r == 0) {
            $("#stage-1").find("circle[data-node-num='" + i + "']").attr("fill", CRITICAL_PATH_CIRCLE_COLOR);
            msg = "-" + i + msg;
        } else {
            $("#stage-1").find("circle[data-node-num='" + i + "']").attr("fill", CIRCLE_COLOR);
        }
    }

    //fill states table
    var statesTableHtml = "";
    statesOne.forEach(function (state) {
        statesTableHtml += '<tr><th scope="row">' + state.id + '</th><td>' + state.prev + '</td><td>' + state.next + '</td><td>' + state.tp + '</td><td>' + state.tn + '</td><td>' + state.r + '</td></tr>';
    });

    $("#states-table-1").html(statesTableHtml);

    showAlert("Критический путь " + msg + "  равен " + statesOne[statesOne.length - 1].tp, "alert-warning")
});

$("#work-table-1").on("keypress", "td[data-work-id]", function (e) {
    var keyCode = e.which ? e.which : e.keyCode;
    if (!(keyCode >= 48 && keyCode <= 57)) {
        return false;
    } else {
        $(this).removeClass("table-danger");
        $(this).addClass("table-success");
    }
});


$("#work-table-1").on('blur', "td[data-work-id]", function (e) {
    worksOne.forEach(function (work) {
        let cell = $("#work-table-1").find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        }
    });
});
