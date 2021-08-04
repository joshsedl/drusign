<?php

namespace Drupal\drusign\Form;

use Drupal\node\Entity\Node;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Class ContractReceiverForm
 *
 * The Form for the contract sending.
 *
 * @package Drupal\drusign\Form
 */
class SendButtonForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormID() {
    return 'drusign_send_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'drusign/initViewContract';
    $form['contractSendButton'] = [
      '#type' => 'submit',
      '#value' => t('Send'),
      '#weight' => 100,
    ];
    return $form;
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
    $this->sendContractMail();
  }

  /**
   * Creation of the mail containing the link to the contract
   *
   * @return void
   */
  protected function sendContractMail() {
    // Get the child node of the node, this Button is rendered on:
    $node = \Drupal::routeMatch()->getParameter('node');
    $referencedNodeId = $node->get('field_vertrags_empfaenger')->getString();
    $referencedNode = Node::load($referencedNodeId);
    // Get the mail address of the recipient
    $email = $referencedNode->get('field_email')->getString();

    //Set Contract Status to sent
    $node->set('field_status', '1')
      ->save();

    //Get the url Alias of the node
    $nodeId = $referencedNode->id();
    $url_alias = \Drupal::service('path_alias.manager')->getAliasByPath('/node/' . $nodeId, \Drupal::currentUser()->getPreferredLangcode()); //Output "/node/29/
    $hostname = $this->getRequest()->getSchemeAndHttpHost();
    $url = $hostname . "/drusign/retrieve" . $url_alias;
    $receiverName = $referencedNode->get('field_lastname')->getString();
    $senderName = \Drupal::currentUser()->getAccountName();

    /**
     * @var $mailManager Drupal\Core\Mail\MailManagerInterface
     */
    $mailManager = \Drupal::service('plugin.manager.mail');
    $module = 'drusign';
    $key = 'drusign_send_contract';
    $to = $email;
    $langcode = \Drupal::currentUser()->getPreferredLangcode();
    $params = ["contractUrl" => $url,
               "receiverName" => $receiverName,
               "senderName" => $senderName
              ];
    $reply = NULL;
    $send = true;

    $result = $mailManager->mail($module, $key, $to, $langcode, $params, $reply, $send);
    if ($result['result'] !== true) {
      \Drupal::messenger()->addError(t('There was a problem sending your message and it was not sent.'));
    } else {
      \Drupal::messenger()->addStatus(t('Your message has been sent.'));
    }
  }
}
