var counter = -1;

var candidateNode = null;

var works = [];
var states = [];

const nodeColor = '#C2185B';
var svg = SVG('stage').size("100%", 900);

var nodes = svg.group();
svg.dblclick(function (evt) {
    let e = evt.target;

    let dim = e.getBoundingClientRect();

    let x = evt.clientX - dim.left;

    let y = evt.clientY - dim.top;
    let currentNodeNumber = ++counter;
    var node = nodes.group().translate(x, y).draggy();

    node.circle(70)
        .fill(nodeColor)
        .attr("data-node-num", currentNodeNumber)
        .opacity(0.8);

    node.on('contextmenu', function () {
        let nodeNumber = $(this.node).find('text').html();
        this.remove();
        works = $.grep(works, function (work) {
            if (work.source == nodeNumber || work.target == nodeNumber) {
                $('#' + work.id).remove();
                return false;
            } else {
                return true;
            }
        });

        //removing countdown
        works.forEach(function (work) {
                if (work.source > nodeNumber) {
                    work.source--;
                }
                if (work.target > nodeNumber) {
                    work.target--;
                }
            }
        );

        $('.node-number').each(function () {
            let currentValue = $(this).html();
            if (nodeNumber < currentValue) {
                $(this).html(--currentValue)
            }
        });
        counter--;
    });
    node.plain(currentNodeNumber)
        .attr("class", "node-number")
        .font({fill: '#000000', family: 'Inconsolata'});
    node.click(function (evt) {
        if (candidateNode === this) {
            this.children()[0].fill({color: nodeColor});
            candidateNode = null;

        } else if (candidateNode) {
            let currentValue = this.children()[1].node.textContent;
            let previousValue = candidateNode.children()[1].node.textContent;

            let isAlreadyExist = works.some(function (work) {
                return work.source == previousValue && work.target == currentValue;
            });


            if (currentValue < previousValue) {
                showAlert("Переход из большего в меньшее не возможен!", "alert-danger");
            } else if (isAlreadyExist) {
                showAlert("Дублирующий переход из состояния " + previousValue + " в состояние " + currentValue + " не возможен!", "alert-danger");
            } else {
                let connectable = candidateNode.connectable({
                    marker: 'default',
                    targetAttach: 'perifery',
                    sourceAttach: 'perifery',
                    color: '#2a88c9'
                }, this);
                let connectorId = $(connectable.connector.node).attr("id");

                //remove work
                console.log(connectable.connector);
                connectable.connector.on('contextmenu',function () {
                    let connectorId = this.id();
                    works = $.grep(works, function (work) {
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
                this.children()[0].fill({color: nodeColor});
                candidateNode.children()[0].fill({color: nodeColor});
                candidateNode = null;
            }
        } else {
            candidateNode = this;
            candidateNode.children()[0].fill({color: '#b4ff47'})
        }
    });

});


$("#validation-btn").click(function (e) {
    states = [];
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

    var msg = "";
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
        showAlert("Нарисуйте ниже сетевую модель", "alert-warning")
    } else if (msg.length == 0) {
        let tableHtml = "";
        works.forEach(function (work) {
            console.log(work);
            tableHtml += "<tr><td class='table-info'>" + work.source + "</td><td class='table-info'>" + work.target + "</td><td data-work-id='" + work.id + "'contenteditable='true'" +
                (work.time ? "class='table-success'>" + work.time : ">") + "</td></tr>";
        });
        $("#work-table").html(tableHtml);
        showAlert("Сетевая модель валидна. В таблицу работ введите длительности", "alert-success")
    } else {
        showAlert(msg, "alert-danger");
    }
});

function showAlert(text, type) {
    let alert = $("#message-alert");
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "block");
    $("#message-alert-text").html(text);
    alert.addClass(type);
}

$("#alert-close-btn").click(function (e) {
    let alert = $("#message-alert");
    alert.removeClass("alert-danger");
    alert.removeClass("alert-success");
    alert.css("display", "none");
});

$("#calculate-btn").click(function (e) {
    works.forEach(function (work) {
        let cell = $("#work-table").find('td[data-work-id="' + work.id + '"]');
        let time = cell.html();
        if (time) {
            work.time = parseInt(time, 10);
        } else {
            $(cell).addClass("table-danger");
            showAlert("В таблице работ заполнены не все длительности!", "alert-danger");
            return;
        }
    });

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

    var msg = "";
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
            $("#stage").find("circle[data-node-num='" + i + "']").attr("fill", "#fff61c");
            msg = "-" + i + msg;
        } else {
            $("#stage").find("circle[data-node-num='" + i + "']").attr("fill", nodeColor);
        }
    }

    //fill states table
    var statesTableHtml = "";
    states.forEach(function (state) {
        statesTableHtml += '<tr><th scope="row">' + state.id + '</th><td>' + state.prev + '</td><td>' + state.next + '</td><td>' + state.tp + '</td><td>' + state.tn + '</td><td>' + state.r + '</td></tr>';
    });

    $("#states-table-1").html(statesTableHtml);

    showAlert("Критический путь " + msg + "  равен " + states[states.length - 1].tp, "alert-warning")
});

$("#work-table").on("keypress", "td[data-work-id]", function (e) {
    var keyCode = e.which ? e.which : e.keyCode;
    if (!(keyCode >= 48 && keyCode <= 57)) {
        return false;
    } else {
        $(this).removeClass("table-danger");
        $(this).addClass("table-success");
    }
});