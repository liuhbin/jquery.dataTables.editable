/**
 * @summary     Jquery.DataTables.Editable
 * @description Jquery.DataTables inline editor extensions
 * @version     0.1.0
 * @file        jquery.dataTables.editable.js
 * @author      nian2760
 * @license     MIT
 */
(function (window, document) {
    (function ($, datatable) {
        "use strict";
       
        var Controller = function (dtSettings) {

            if (!datatable.versionCheck || !datatable.versionCheck("1.10"))
                throw "jquery.dataTables.editable: less than 1.10.0 datatables version, need 1.10.x or newer";

            dtSettings.oInstance.oController = this;
            
            var _api = datatable.Api;

            _api.register("destroyCtrl()", function () {
                this.settings()[0].oInstance.oController._destroy(this);
                return this;
            });

            _api.register("row().edit()", function (success) {
                this.settings()[0].oInstance.oController._edit(this, success);
                return this;
            });

            _api.register("row().complete()", function (beforeCall) {
                this.settings()[0].oInstance.oController._complete(this, beforeCall);
                return this;
            });

            _api.register("row().cancel()", function () {
                this.settings()[0].oInstance.oController._cancel(this);
                return this;
            });

            _api.register("row().rollback()", function (index) {
                this.settings()[0].oInstance.oController._rollback(this,index);
                return this;
            });

            _api.register("row.addition()", function (edit, rowJson) {
                this.settings()[0].oInstance.oController._add(this, rowJson);
                return this;
            });

            _api.register("row().remove()", function () {
                this.settings()[0].oInstance.oController._remove(this);
                return this;
            });
        };
        Controller.prototype = {
            _info: {
                edit: {
                    editing: false,
                    row:null,
                    log: [],
                    logCacheLength: 1,
                    getLog: function (row) {
                        return $.map(this.log, function (item) { return item.row.node() === row.node() ? item : null; });
                    },
                    addLog: function (row, data) {
                        var findRow = this.getLog(row);
                        if (findRow.length > 0) {
                            findRow[0].data.push(data);
                            findRow[0].location += 1;
                            if (findRow[0].data.length > logCacheLength)
                                findRow[0].data.splice(0, 1);
                        }
                        else
                            this.log.push({
                                row: row,
                                data: [data],
                                location: 1
                            });
                    }
                }
            },

            _format: function (row, rowData, colData, colIndex, editOpt) {
                var format;
                var $td = $(row.node()).find("td").eq(colIndex);
                var index = row.cell($td).index();
                var clsName = typeof editOpt.className === "string" ? editOpt.className : undefined
                if (editOpt.render && typeof editOpt.render === "function")
                    format = editOpt.render(colData, rowData, index);
                else
                    format = Controller.columnRender(editOpt.type || "text", colData, rowData, clsName);
                $td.html(format);
            },
            _edit: function (row,success) {
                if (row.length == 0 || this._info.edit.editing) return;

                this._info.edit.row = row;
                var rowData = row.data();
                var columns = row.settings()[0].aoColumns;

                var n = 0;
                for (var i = 0; i < columns.length; i++) {
                    var c = columns[i];
                    if (c.edit == false) n++;
                    else this._format(row, rowData, rowData[c.mData], c.idx, $.isPlainObject(c.edit) ? c.edit : Controller.defaults);
                }
                if (n != columns.length) {
                    this._info.edit.editing = true;
                    success(row);
                }
            },
            _complete: function (row, beforeCall) {
                if (row.length == 0 || !this._info.edit.editing) return;
                var $tr = $(row.node());
                var $tds = $tr.find("td");
                var oldData = row.data();
                var newData = $.extend(true, oldData instanceof Array ? [] : {}, oldData);

                var columns = row.settings()[0].aoColumns;
                for (var i = 0; i < columns.length; i++) {
                    var c = columns[i];
                    if (c.edit != false)
                        newData[c.mData] = c.edit && typeof c.edit.value === "function" ? c.edit.value($tr, $tds[c.idx]) : $($tds[c.idx]).children().eq(0).val();
                }

                if (typeof beforeCall == "function") {
                    var _info = this._info;
                    beforeCall(newData, oldData, $tr, function (save) {
                        if (save != false) {
                            row.data(newData);
                            _info.edit.editing = false;
                            _info.edit.addLog(row, oldData);
                        } else row.cancel();
                    });
                }
            },
            _cancel: function (row) {
                if (this.length == 0 || !this._info.edit.editing) return;
                row.data(row.data());
                this._info.edit.editing = false;
            },
            _rollback: function (row, index) {
                if (row.length == 0) return;
                if (isNaN(index)) index = -1;
                var log = this._info.edit.getLog(row);
                if (log.length > 0) {
                    var logLength = log[0].data.length;
                    if (logLength > 0) {
                        if (index < 0)
                            index = logLength + index;
                        if (index >= 0 && index < logLength) {
                            log[0].row.data(log[0].data[index]);
                            log[0].data.splice(index);
                        }
                    }
                }
            },
            _add: function (api, edit, rowJson) {
                var newRowData;
                if (!rowJson) {
                    var rowData = api.row(0).data();
                    newRowData = $.extend(true, rowData instanceof Array ? [] : {}, rowData);
                    for (var i = 0; i < rowData.length; i++)
                        newRowData[i] = "";
                }
                else newRowData = rowJson;
                var newRow = api.row.add(newRowData).draw().node();
                if (edit != false)
                    api.row(newRow).edit();
            },
            _destroy: function (api) {
                api.settings()[0].oInstance.oController = null;
            }

        };

        Controller.defaults = {};

        Controller.columnRender = function (type, colData, rowData, className) {
            return "<input " + (className ? "class='" + className + "'" : "") + " type='" + type + "' value='" + colData + "'/>";
        };

        $(document).on('init.dt', function (e, settings, json) {
            if (settings.oInstance.oController)
            {
                console.error = " the current editable table has been initialized\n please call \"destroyCtrl()\" to destroy";
                return;
            }
            if ($(settings.nTable).attr('data-editable') == true || settings.oInit.editable) {
                new Controller(settings);
            }
        });

        $(document).on('order.dt', function (e, settings, json) {
            var ctrl = settings.oInstance.oController;
            if (ctrl && ctrl._info.edit.editing == true)
                ctrl._cancel(ctrl._info.edit.row);
        });


    }(jQuery, jQuery.fn.dataTable));
}(window, document));
