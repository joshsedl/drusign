(function ($, Drupal) {
  Drupal.behaviors.drusignViewInit = {
    attach: function (context, settings) {
      // ## ON LOAD: ###
      //Runs only once, see https://www.drupal.org/forum/support/module-development-and-code-questions/2018-06-15/run-js-funtion-once-not-attach-once
      $(document, context)
        .once("drusign-init")
        .each(function () {
          console.log('init');
          if (
            !helper.empty(window.localStorage.getItem("privateKey")) ||
            !helper.empty(window.localStorage.getItem("publicKey"))
          ) {
            $('div.text-content div.field__item').hide();
            $('div.text-content').append(
              $('<div>')
                .attr("id", "decodedDiv")
                .addClass("decodedText")
                .text("Loading...")
            );
            var encrypted_text = $('div.text-content div.field__item').text();
            //Trim string so openpgp can decrypt the Message:
            var trimed_encrypted_text = encrypted_text.trim();
            drusignCrypto.decrypt(trimed_encrypted_text).then((unencrypted_text) => {
              $("#decodedDiv").html(unencrypted_text);
            });
          } else {
            $("div.region--content").hide();
            $("div.shortcut-wrapper").hide();
            $('div.region--breadcrumb').append(
              $('<h2>')
                .attr("id", "noKeyText")
                .addClass("noKeyTextClass")
                .text("Please upload your Public/Private Key Pair under the 'Schlüssel' Tab, to view and send your Contract!")
            );
            alert("Your Public Key is not fetched yet! Visit the 'Schlüssel' Page to fetch your public Key!");
          }
        });
    },
  };
})(jQuery, Drupal);
