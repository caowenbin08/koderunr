$(function() {
  var KodeRunr = function(ext){
    this.editor = ace.edit("editor");
    this.editor.setTheme("ace/theme/monokai");
    this.editor.setOptions({
      fontSize: "12pt",
    });

    this.setExt(ext);
  }

  KodeRunr.prototype.LANG_MAPPING = {
    ".go": "golang",
    ".rb": "ruby",
    ".c": "c_cpp",
  };

  KodeRunr.prototype.setExt = function(ext) {
    this.ext = ext;
    this.editor.getSession().setMode("ace/mode/" + this.LANG_MAPPING[this.ext]);
  };

  KodeRunr.prototype.runCode = function(evt) {
    var sourceCode = this.editor.getValue();

    var runnable = { ext: this.ext, source: sourceCode };
    if (this.version) {
      runnable.version = this.version
    }
    $.post('/register/', runnable, function(msg) {
      // Empty the output field
      $("#streamingResult").text("");
      var evtSource = new EventSource("/run?evt=true&uuid=" + msg);
      evtSource.onmessage = function(e) {
        var text = $("#streamingResult").text();
        $("#streamingResult").text(text + e.data);
      }
    });
  };

  var sourceCodeCache = sourceCodeCache || {};
  sourceCodeCache.fetch = function(runner) {
    return localStorage.getItem(runner.ext)
  }

  sourceCodeCache.store = function(runner){
    localStorage.setItem(runner.ext, runner.editor.getValue())
  }

  var runner = new KodeRunr($("#ext").val());

  $("#submitCode").on("click", runner.runCode.bind(runner));

  $("#ext").on("change", function() {
    // Empty the screen
    sourceCodeCache.store(runner)
    runner.editor.setValue("", undefined);
    $("#streamingResult").text("");

    var [ext, version] = this.value.split(" ")
    runner.setExt(ext);

    runner.version = version

    var cachedSourceCode = sourceCodeCache.fetch(runner)
    if (cachedSourceCode) {
      runner.editor.setValue(cachedSourceCode, 1);
    }
  })
});