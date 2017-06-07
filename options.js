$(function(){
  $(":checkbox").each(function(i, e){
    var $this = $(e),
        name = $this.attr("name")
    if(name && !localStorage[name]){
      localStorage[name] = true
    }
    $this.prop("checked", JSON.parse(localStorage[name]))
  })

  $(document).on('change', ':checkbox', function(){
    var $this = $(this),
        name = $this.attr("name")
    localStorage[name] = $this.prop("checked")
  })
})