(function ($, Drupal) {
  Drupal.behaviors.drusignGetKeys = {
    attach: function (context, settings) {
      //Fetch Public Key Logic
      $("#fetchPubSubmit", context).click(function (e) {
        e.preventDefault();
        let mail = $("#mailField").val();
        fetchAndCache.fetchPublicKey(mail);
      });

      $("#uploadKey", context).click(function (e) {
        e.preventDefault();
        let privFile = $("#privFileUpload").prop("files")[0];
        console.log(privFile);
        let passphrase = $('#privFilePassphrase').val();
        fetchAndCache.uploadPrivateKeyInCache(privFile, passphrase);
      });
    },
  };
})(jQuery, Drupal);
