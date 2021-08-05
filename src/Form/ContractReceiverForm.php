<?php

namespace Drupal\drusign\Form;

use Drupal\node\Entity\Node;
use Drupal\Core\Form\FormBase;
use Drupal\Component\Utility\Html;
use Drupal\Core\Form\FormStateInterface;
use Drupal\drusign\Exceptions\NodeNotFoundException;
use Drupal\drusign\Exceptions\WrongIdentificationError;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Class ContractReceiverForm
 *
 * The Form for the Contract Receiver.
 *
 * @package Drupal\drusign\Form
 */
class ContractReceiverForm extends FormBase {

  /**
   * Get the Form id of this specific Form.
   *
   * @return string
   */
  public function getFormId() {
    return 'drusign_receiver_form';
  }

  /**
   * {@inheritdoc}
   *
   * @param int $entity_id
   * @throws AccessDeniedHttpException
   * @return array
   */
  public function buildNode($entity_id): array {
    $current_user = \Drupal::currentUser();
    $user = \Drupal\user\Entity\User::load($current_user->id());
    $entity = \Drupal::entityTypeManager()->getStorage('node')->load($entity_id);
    if ($entity->access($user)) //TODO: Aufpassen! Abfrage könnte nach hinten losgehen, wenn der Kunde kein Zugriff mehr hier hat!
    {
      $view_builder = \Drupal::entityTypeManager()->getViewBuilder('node');
      $pre_render = $view_builder->view($entity, 'vertragsempfaenger_ans');
      return $pre_render;
    }
    throw new AccessDeniedHttpException("You don't have access to this Node!!");
  }

  /**
   * {@inheritdoc}
   *
   * @param int $nId
   *    The node id.
   * @return array
   *    The render Array for the Form.
   */
  public function buildForm(array $form, FormStateInterface $form_state, $nId = NULL) {
    try {
      // Compare the verification query with the verification field:
      $request = \Drupal::request();
      $verificationId = $request->query->get('v');
      $referencedNode = Node::load($nId);
      $verificationFieldValue = $referencedNode->get('field_verifizierung')->getString();
      if (!($verificationId == $verificationFieldValue)) {
        throw new WrongIdentificationError;
      }
      // Attaching javascript 'initAcceptContract':
      $form['#attached']['library'][] = 'drusign/initAcceptContract';

      // Get triggering element for AJAX call cases:
      $triggeringElement = $form_state->getTriggeringElement();

      // ------------------------ File field for Private Key Submission ------------------------
      $form['uploadPrivKeyWrapper'] = [
        '#title' => "Upload your Private Key to decrypt your Contract:",
        '#type' => 'details',
        '#open' => TRUE,
        '#description' => $this->t('Please upload your Private Key File and press the "Upload Private Key" button.</br><strong>NOTE: Your Key will be uploaded in the local Storage of your Browser, it will NOT get uploaded on any Database or Cloud and therefore, it will NOT get compromised!!</strong>'),
        '#id' => 'uploadWrapper',
      ];

      $form['uploadPrivKeyWrapper']['privKeyFileUpload'] = [
        '#type' => 'file',
        '#id' => 'privFileUpload',
      ];

      $form['uploadPrivKeyWrapper']['privFilePassphrase'] = [
          '#type' => 'password',
          '#id' => 'privFilePassphrase',
          '#title' => $this->t('Please enter your private key passphrase:')
        ];

      $form['uploadPrivKeyWrapper']['privKeyFileSubmit'] = [
        '#type' => 'submit',
        '#id' => 'uploadKey',
        '#value' => $this->t(
          'Upload Private Key'
        )
      ];

      // Render the 'Vertragsempfänger' node:
      $form['my_node'] = $this->buildNode($nId);
      // Workaround for core bug #2897377.
      // Also see https://www.drupal.org/node/3032530.
      $form['#id'] = Html::getId($form_state->getBuildInfo()['form_id']);
      // ------------------------ Contract Received Form and Logic ------------------------

      //Logic for the empfaengerDaten #default values:
      $firstname = $referencedNode->get('field_firstname')->getString();
      $name = $referencedNode->get('field_lastname')->getString();
      $firma = $referencedNode->get('field_firma')->getString();

      $form['empfaengerDaten'] = [
        '#type' => 'details',
        '#open' => TRUE,
        '#title' => $this->t('Your Contact Data'),
        '#description' => $this->t('Please verify your Contact Data before continuing!')
      ];
      $form['empfaengerDaten']['empfaengerName'] = [
        '#type' => 'textfield',
        '#id' => 'empfaengerName',
        '#default_value' => $name,
        '#title' => $this->t('Your name')
      ];
      $form['empfaengerDaten']['empfaengerVorname'] = [
        '#type' => 'textfield',
        '#id' => 'empfaengerVorname',
        '#default_value' => $firstname,
        '#title' => $this->t('Your pre-name')
      ];
      $form['empfaengerDaten']['empfaengerFirma'] = [
        '#type' => 'textfield',
        '#id' => 'empfaengerFirma',
        '#default_value' => $firma,
        '#title' => $this->t('Your company')
      ];

      $form['vertragAkzeptieren'] = [
        '#type' => 'submit',
        '#id' => 'vertragAkzeptieren',
        '#value' => $this->t('Accept Contract'),
        '#ajax' => [
          'wrapper' => $form['#id'],
          'callback' => '::contractAcceptedCallback',
        ]
      ];
      $form['vertragAblehnen'] = [
        '#type' => 'submit',
        '#id' => 'vertragAblehnen',
        '#value' => $this->t('Reject Contract'),
        '#ajax' => [
          'wrapper' => $form['#id'],
          'callback' => '::contractRejectedCallback',
        ]
      ];

      // ------------------------ Contract Accepted Form and Logic ------------------------

      // Show the downloadContract form if the contract was accepted:
      if (!empty($triggeringElement) && $triggeringElement['#id'] == 'vertragAkzeptieren') {
        $form['downloadContract'] = [
          '#type' => 'submit',
          '#id' => 'downloadContract',
          '#value' => $this->t('Print / Download Contract'),
        ];
      }
      return $form;
    } catch (\Throwable $th) {
      throw new NotFoundHttpException;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Rebuilds the form if necessary:
    $form_state->setRebuild(TRUE);
  }

  /**
   * The callback function for the 'vertragAkzeptieren' ajax callback
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return array
   */
  public function contractAcceptedCallback(array $form, FormStateInterface $form_state) {
    // Get the 'vertrags_empfaenger' node:
    $node = $form['my_node']['#node'];
    $this->sendContractAcceptedMail($node);

    if ($parent_node = $this->getParentNode($node)) {
      // Set the contract status to accepted:
      $parent_node->set('field_status', '2')
        ->save();
    } else {
      // If the parent node is null throw an error:
      throw new NodeNotFoundException;
    }
    $form['vertragAkzeptieren'] = [];
    $form['vertragAblehnen'] = [];
    $form['empfaengerDaten'] = [];
    $form['uploadPrivKeyWrapper'] = [];
    return $form;
  }

  /**
   * The callback function for the 'vertragAblehnen' ajax callback
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return array
   */
  public function contractRejectedCallback(array $form, FormStateInterface $form_state) {
    // Get the 'vertrags_empfaenger' node:
    $node = $form['my_node']['#node'];
    $this->sendContractRejectedMail($node);
    if ($parent_node = $this->getParentNode($node)) {
      // Set the contract status to rejected:
      $parent_node->set('field_status', '3')
        ->save();
    } else {
      // If the parent node is null throw an error:
      throw new NodeNotFoundException;
    }
    // Hide the other not important forms:
    $form['vertragAkzeptieren'] = [];
    $form['vertragAblehnen'] = [];
    $form['empfaengerDaten'] = [];
    $form['uploadPrivKeyWrapper'] = [];
    return $form;
  }

  /**
   * Receive the parent node of the 'vertrags_empfaenger' node
   *
   * @param object $node
   *    The vertragsempfaenger node.
   * @return object
   *    The parent node.
   */
  public function getParentNode($node){
    //Get the first (and only) parent_node out of the parent node array, multiple entries are not possible, since we always create a new 'vertrags_empfaenger' on every 'vertrag' creation:
    $parent_node_array = \Drupal::entityTypeManager()
      ->getListBuilder('node')
      ->getStorage()
      ->loadByProperties(
        [
          'type' => 'vertrag',
          'field_vertrags_empfaenger' => $node->id(),
        ]
      );
      $parent_node = reset($parent_node_array);
      return $parent_node;
  }

  /**
   * Creation of the 'Contract Accepted Mail'
   *
   * @param object $node
   * @return void
   */
  protected function sendContractAcceptedMail($node) {
    // Get the e-mail adress of the creator of the contract:
    $mail = $node->getOwner()->getEmail();
    // Get recipients personal information for the mail content:
    $userMailA = $node->get('field_email')->getString();
    $userNameA = $node->get('field_lastname')->getString();
    $contractNameA = $this->getParentNode($node)->get('title')->getString();

    /**
     * @var $mailManager Drupal\Core\Mail\MailManagerInterface
     */
    $mailManager = \Drupal::service('plugin.manager.mail');
    $module = 'drusign';
    $key = 'drusign_send_accepted';
    $to = $mail;
    $langcode = \Drupal::currentUser()->getPreferredLangcode();
    $params = [
      'userMailA' => $userMailA,
      'userNameA' => $userNameA,
      'contractNameA' => $contractNameA
    ];
    $reply = NULL;
    $send = true;

    // Mail the corresponding e-mail, the content is created in the .module file:
    $result = $mailManager->mail($module, $key, $to, $langcode, $params, $reply, $send);
    if ($result['result'] !== true) {
      \Drupal::messenger()->addError(t('There was a problem sending your message and it was not sent.'));
    } else {
      \Drupal::messenger()->addStatus(t('The Contract is accepted, the Contract Holder will be notified.'));
    }
  }

  /**
   * Creation of the 'Contract Rejected Mail'
   *
   * @param object $node
   * @return void
   */
  protected function sendContractRejectedMail($node) {
    // Get the e-mail adress of the creator of the contract:
    $mail = $node->getOwner()->getEmail();
    // Get recipients personal information for the mail content:
    $userMailR = $node->get('field_email')->getString();
    $userNameR = $node->get('field_lastname')->getString();
    $contractNameR = $this->getParentNode($node)->get('title')->getString();

    /**
     * @var $mailManager Drupal\Core\Mail\MailManagerInterface
     */
    $mailManager = \Drupal::service('plugin.manager.mail');
    $module = 'drusign';
    $key = 'drusign_send_rejected';
    $to = $mail;
    $langcode = \Drupal::currentUser()->getPreferredLangcode();
    $params = [
      'userMailR' => $userMailR,
      'userNameR' => $userNameR,
      'contractNameR' => $contractNameR
    ];
    $reply = NULL;
    $send = true;

    // Mail the corresponding e-mail, the content is created in the .module file:
    $result = $mailManager->mail($module, $key, $to, $langcode, $params, $reply, $send);
    if ($result['result'] !== true) {
      \Drupal::messenger()->addError(t('There was a problem sending your message and it was not sent.'));
    } else {
      \Drupal::messenger()->addError(t('The Contract was rejected, the Contract Holder will be notified.'));
    }
  }
}
