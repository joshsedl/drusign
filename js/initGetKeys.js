(function ($, Drupal) {
  Drupal.behaviors.drusignGetKeys = {
    // On load:
    attach: function (context, settings) {
      // Fetch the public key on submit press:
      $("#fetchPubSubmit", context).click(function (e) {
        e.preventDefault();
        let mail = $("#mailField").val();
        fetchAndCache.fetchPublicKey(mail);
      });

      // Fetch the private key from given file:
      $("#uploadKey", context).click(function (e) {
        e.preventDefault();
        let privFile = $("#privFileUpload").prop("files")[0];
        let passphrase = $('#privFilePassphrase').val();
        fetchAndCache.uploadPrivateKeyInCache(privFile, passphrase);
      });
    },
  };
})(jQuery, Drupal);
