//var VueBarcode = require('vue-barcode');
var VueBarcode = require('@xkeshi/vue-barcode');

var clipboard = new ClipboardJS('.copy2clipboard');

clipboard.on('success', function(e) {
    $('#icomsCopyMain').find('.icomsCopyContainer').each(function(){
      $(this).removeClass('currentCopied')
    });
    e.clearSelection();
    $(e.trigger).siblings('textarea').addClass('currentCopied');
    var saved = $(e.trigger).text('Copied!');
    setTimeout(function() { $(e.trigger).text('Copy'); $(e.trigger).blur(); }, 2000);
});
clipboard.on('error', function(e) {
    alert('There was an issue with the copy. Try manually copying.');
});



Vue.component(VueBarcode.name, VueBarcode);

var barcodeModel = new Vue({
    el: '#app',
    data: {
        barcodes: [],
        // false = 6, true = 12
        globalColumn: false,
        identify: '',
        barcodeInput: '',
        selectType: '',
    },
    computed: {
        reversedOrderBarcodes() {
            return this.barcodes.slice().reverse();
        },
        icomsArrays() {
          return this.chunk(this.reversedOrderBarcodes, 14);
        },
        pageTitleString() {
          var pageTitleVar = 'Edgewater Investments - ' + this.identify + ' ' + this.selectType + ' - ' + this.barcodes.length + ' Pieces';
          return pageTitleVar;
        },
    },
    watch: {
      barcodes: {
        handler() {
          localStorage.setItem('barcodes', JSON.stringify(this.barcodes));
        },
        deep: true,
      },
      identify: {
        handler() {
          localStorage.setItem('identify', JSON.stringify(this.identify));
        },
      },
      selectType: {
        handler() {
          localStorage.setItem('selectType', JSON.stringify(this.selectType));
        },
      },
      globalColumn: {
        handler() {
          localStorage.setItem('globalColumn', JSON.stringify(this.globalColumn));
          if(this.globalColumn == false) {
            this.barcodes.map(function(item, index) { item.columnSize = 6; item.alternateColumn = false; });
          } else {
            this.barcodes.map(function(item, index) { item.columnSize = 12; });
          }
        },
      },
      pageTitleString: {
        handler() {
          document.title = this.pageTitleString;
        },
      },
    },
    mounted() {
      if (localStorage.getItem('barcodes')) this.barcodes = JSON.parse(localStorage.getItem('barcodes'));
      if (localStorage.getItem('identify')) this.identify = JSON.parse(localStorage.getItem('identify'));
      if (localStorage.getItem('selectType')) this.selectType = JSON.parse(localStorage.getItem('selectType'));
      if (localStorage.getItem('globalColumn')) this.globalColumn = JSON.parse(localStorage.getItem('globalColumn'));
    },
    methods: {
        addNewBarcode(barcode) {
              this.barcodes.push({'serial': barcode, 'alternateColumn': false, 'columnSize': (this.globalColumn == false) ? 6 : 12});
              var originalArray = this.barcodes;
              this.barcodes = this.removeDuplicatesByProp(originalArray, 'serial');
              this.barcodeInput = '';
              document.getElementById('barcode-input').focus();
        },
        deleteBarcode(barcode) {
            var originalArray = this.barcodes;
            this.barcodes = originalArray.filter(function(e) { return e.serial !== barcode });
            document.getElementById('barcode-input').focus();
        },
        updateArrayColumn(serial, event) {
          var checked = event.target.checked;
          var index = this.barcodes.findIndex(p => p.serial == serial);
          this.barcodes[index].columnSize = (checked) ? 12 : 6;
        },
        processPaste(event) {
          var clipboardData, pastedData;
          clipboardData = event.clipboardData || window.clipboardData;
          pastedData = clipboardData.getData('Text');
          processPasteData(pastedData);
          return true;
        },
        removeDuplicatesByProp(myArr, prop) {
          return myArr.filter((obj, pos, arr) => {
              return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
          });
        },
        removeDuplicatesFlatArray(myArr) {
          return myArr.filter(function(elem, pos,arr) {
              return arr.indexOf(elem) == pos;
          });
        },
        deleteBarcodes() {
            this.barcodes = [];
            this.identify = '';
            this.selectType = '';
            this.barcodeInput = '';
            document.getElementById('identify').focus();
        },
        chunk(arr, size) {
          return arr.reduce(function(acc, x, i) {
            if (i % size === 0) {
              acc.push([x])
            } else {
              acc[acc.length-1].push(x)
            }
            return acc
          },[])
        }
    },
});

$(document).ready(function(){
    // Scanner detection
    $('#barcode-input').scannerDetection({
      timeBeforeScanTest: 200, // wait for the next character for upto 200ms
      	avgTimeByChar: 40, // it's not a barcode if a character takes longer than 100ms
      	//preventDefault: true,
      	endChar: [13],
      		onComplete: function(barcode, qty){
         validScan = true;
                 processBarcode(barcode);
          } // main callback function	,
      	,
        onError: function(string, qty) {
      	console.log(string);
      }
    });
    // allow user to enter barcode manually too :)
    $('#barcode-input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13') { // Enter key was pressed
            processBarcode($(this).val());
        }
    });

    // focus input on page load
    $('#identify').focus();

    $('#icomsCopyButtom').on('click', function() {
        if(barcodeModel.barcodes.length < 1) {
          alert('You must have a scanned barcode first!');
        } else {
          $('.icomsCopyContainer').removeClass('currentCopied');
          $('#icomsCopy').modal({
              backdrop: 'static',
              keyboard: false,
          });
        }
    });

});

// show date
var dNow = new Date();
var localdate= (dNow.getMonth()+1) + '/' + dNow.getDate() + '/' + dNow.getFullYear();
document.getElementById('identify-d').innerHTML=localdate;

// function for processing barcode input
function processBarcode(barcodeInput) {
    var barcode = barcodeInput.trim().toUpperCase();
    var len = barcode.length;
    if(len > 0) {
        barcodeModel.addNewBarcode(barcode);
    } else {
        alert('field is empty!');
    }
}

function processPasteData(paste) {
  var lines = paste.split(/\n/);
  var lines2array = [];
  for (var i=0; i < lines.length; i++) {
    // only push this line if it contains a non whitespace character.
    if (/\S/.test(lines[i])) {
      lines2array.push($.trim(lines[i]));
    }
  }
  setTimeout(function () {
    $.each(lines2array, function( index, value ) {
      processBarcode(value);
    });
  }, 100);
}
