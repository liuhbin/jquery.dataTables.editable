# jquery.dataTables.editable
##使用
####参数说明
| Property  |Type   |  Default |  description |
| ------------ | ------------ | ------------ | ------------ |
|  edit |object&#124;bool  | true  |是否编辑&#124;单元格编辑配置   |
|  edit.type |string |text   | 指定默认input.type   |
|  edit.className |string   |   |指定默认input.class   |
|  edit.render |function   |  |自定义单元格渲染   |
|  edit.value |function   |   |自定义单元格提取值   |

####方法说明
| function  |  param |  example |description |
| ------------ | ------------ | ------------ |
| edit  |  function | edit(function(rowApi){})   |  编辑成功回调 |
| function  |  function |complete(function (newData, oldData, rowDom, callback) {}  |  编辑完成回调 |
| cancel   |   | cancel() |  取消编辑 |
| rollback  |  int | rollback() |  回滚到上一次的值 |

####简单初始化
```javascript
$("#table").Datatable({
	editable:true
});
```
####渲染列
```javsscript
$("#table").Datatable({
	editable:true,
	columns:[{
		data:"field1",
		edit:false // not edit
	},{
		data:"field2",
		edit:{
			type:"text",  // input type
			className:"clsName" // custom name class
		}
	},{
		edit:{
			// custom cell editing
			render: function (data, row, meta) {
				return "<input type='text' value='" + data + "'/>";
			},
			//  custom cell fetch values
			value: function (row, cell) {
				var input = $(cell).children()[0];
				return $(input).val();
			}
		}
	}],
	// or
	 columnDefs: [
	 	{
			target:[0,2],
			edit:{}
		}
	 ]
```

####操作
```javascript
$(table).on("click", ".edit", function () {
	// begin editing
	var $tr = $(this).parents("tr")[0];
	// "table.row()" : please refer to the official documentation 
	//  https://datatables.net/reference/api/row()
	table.row($tr).edit(function (rowApi) {
		// successful callback
	});
).on("click", ".complete", function () {
 	// complete edit
 	var $tr = $(this).parents("tr")[0];
 	table.row($tr).complete(function (newData, oldData, rowDom, callback) {
		console.log(newData);
		console.log(oldData);
		$.ajax({
		 	type: "post",
		 	url: "/update",
		 	success: function (resp) {
				// save
				callback();
		 	},
		 	error: function () {
				// cancel
				callback(false);
		 }
	});
 });
}).on("click", ".cancel", function () {
	// cancel edit
	var $tr = $(this).parents("tr")[0];
	table.row($tr).cancel();
}).on("click", ".rollback", function () {
	 // roll back to before the change
 	var $tr = $(this).parents("tr")[0];
 	table.row($tr).rollback();
});
```
