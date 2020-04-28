<?php

function cvl_visualization_admin_overview($keys = NULL) {
  // Add the filter form above the overview table.
  //$build['cvl_visualization_admin_filter_form'] = drupal_get_form('cvl_visualization_admin_filter_form', $keys);
  // Enable language column if locale is enabled or if we have any alias with language
  $alias_exists = (bool) db_query_range('SELECT 1 FROM {url_alias} WHERE language <> :language', 0, 1, array(':language' => LANGUAGE_NONE))->fetchField();
  $multilanguage = (module_exists('locale') || $alias_exists);

  $header = array();
  $header[] = array('data' => t('Identifier'), 'field' => 'alias', 'sort' => 'asc');
  $header[] = array('data' => t('SOLR CORE'), 'field' => 'source');
  $header[] = array('data' => t('Operations'));

  $query = db_select('url_alias')->extend('PagerDefault')->extend('TableSort');
  $result = $query
    ->fields('url_alias')
    ->orderByHeader($header)
    ->limit(50)
    ->execute();

  $rows = array();
  $destination = drupal_get_destination();
  foreach ($result as $data) {
    $row = array();
    $row['data']['alias'] = l($data->alias, $data->source);
    $row['data']['source'] = l($data->source, $data->source, array('alias' => TRUE));
    if ($multilanguage) {
      $row['data']['language'] = module_invoke('locale', 'language_name', $data->language);
    }

    $operations = array();
    $operations['edit'] = array(
      'title' => t('edit'),
      'href' => "admin/config/services/cvl_visualization/edit/$data->pid",
      'query' => $destination,
    );
    $operations['delete'] = array(
      'title' => t('delete'),
      'href' => "admin/config/search/cvl_visualization/delete/$data->pid",
      'query' => $destination,
    );
    $row['data']['operations'] = array(
      'data' => array(
        '#theme' => 'links',
        '#links' => $operations,
        '#attributes' => array('class' => array('links', 'inline', 'nowrap')),
      ),
    );

    $rows[] = $row;
  }

  $build['cvl_visualization_table'] = array(
    '#theme' => 'table',
    '#header' => $header,
    '#rows' => $rows,
    '#empty' => t('No URL aliases available. <a href="@link">Add URL alias</a>.', array('@link' => url('admin/config/search/cvl_visualization/add'))),
  );
  $build['cvl_visualization_pager'] = array('#theme' => 'pager');

  return $build;
}

/**
 * Page callback: Returns a form creating or editing a cvl_visualization alias.
 *
 * @param $cvl_visualization
 *   An array containing the cvl_visualization ID, source, alias, and language code.
 *
 * @return
 *   A form for adding or editing a URL alias.
 *
 * @see cvl_visualization_menu()
 */
function cvl_visualization_admin_edit($cvl_visualization = array()) {
  if ($cvl_visualization) {
    drupal_set_title($cvl_visualization['alias']);
    $output = drupal_get_form('cvl_visualization_admin_form', $cvl_visualization);
  }
  else {
    $output = drupal_get_form('cvl_visualization_admin_form');
  }

  return $output;
}

/**
 * Form constructor for the cvl_visualization administration form.
 *
 * @param $cvl_visualization
 *   An array containing the cvl_visualization ID, source, alias, and language code.
 *
 * @ingroup forms
 * @see cvl_visualization_admin_form_validate()
 * @see cvl_visualization_admin_form_submit()
 * @see cvl_visualization_admin_form_delete_submit()
 */
function cvl_visualization_admin_form($form, &$form_state, $cvl_visualization = array('source' => '', 'alias' => '', 'language' => LANGUAGE_NONE, 'pid' => NULL)) {
  $form['source'] = array(
    '#type' => 'textfield',
    '#title' => t('Existing system cvl_visualization'),
    '#default_value' => $cvl_visualization['source'],
    '#maxlength' => 255,
    '#size' => 45,
    '#description' => t('Specify the existing cvl_visualization you wish to alias. For example: node/28, forum/1, taxonomy/term/1.'),
    '#field_prefix' => url(NULL, array('absolute' => TRUE)) . (variable_get('clean_url', 0) ? '' : '?q='),
    '#required' => TRUE,
  );
  $form['alias'] = array(
    '#type' => 'textfield',
    '#title' => t('Path alias'),
    '#default_value' => $cvl_visualization['alias'],
    '#maxlength' => 255,
    '#size' => 45,
    '#description' => t('Specify an alternative cvl_visualization by which this data can be accessed. For example, type "about" when writing an about page. Use a relative cvl_visualization and don\'t add a trailing slash or the URL alias won\'t work.'),
    '#field_prefix' => url(NULL, array('absolute' => TRUE)) . (variable_get('clean_url', 0) ? '' : '?q='),
    '#required' => TRUE,
  );

  // This will be a hidden value unless locale module is enabled.
  $form['language'] = array(
    '#type' => 'value',
    '#value' => $cvl_visualization['language']
  );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );
  if ($cvl_visualization['pid']) {
    $form['pid'] = array(
      '#type' => 'hidden',
      '#value' => $cvl_visualization['pid'],
    );
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete'),
      '#submit' => array('cvl_visualization_admin_form_delete_submit'),
    );
  }

  return $form;
}

/**
 * Form submission handler for the 'Delete' button on cvl_visualization_admin_form().
 *
 * @see cvl_visualization_admin_form_validate()
 * @see cvl_visualization_admin_form_submit()
 */
function cvl_visualization_admin_form_delete_submit($form, &$form_state) {
  $destination = array();
  if (isset($_GET['destination'])) {
    $destination = drupal_get_destination();
    unset($_GET['destination']);
  }
  $form_state['redirect'] = array('admin/config/search/cvl_visualization/delete/' . $form_state['values']['pid'], array('query' => $destination));
}

/**
 * Form validation handler for cvl_visualization_admin_form().
 *
 * @see cvl_visualization_admin_form_submit()
 * @see cvl_visualization_admin_form_delete_submit()
 */
function cvl_visualization_admin_form_validate($form, &$form_state) {
  $source = &$form_state['values']['source'];
  $source = drupal_get_normal_cvl_visualization($source);
  $alias = $form_state['values']['alias'];
  $pid = isset($form_state['values']['pid']) ? $form_state['values']['pid'] : 0;
  // Language is only set if locale module is enabled, otherwise save for all languages.
  $language = isset($form_state['values']['language']) ? $form_state['values']['language'] : LANGUAGE_NONE;

  $has_alias = db_query("SELECT COUNT(alias) FROM {url_alias} WHERE pid <> :pid AND alias = :alias AND language = :language", array(
      ':pid' => $pid,
      ':alias' => $alias,
      ':language' => $language,
    ))
    ->fetchField();

  if ($has_alias) {
    form_set_error('alias', t('The alias %alias is already in use in this language.', array('%alias' => $alias)));
  }
  if (!drupal_valid_cvl_visualization($source)) {
    form_set_error('source', t("The cvl_visualization '@link_cvl_visualization' is either invalid or you do not have access to it.", array('@link_cvl_visualization' => $source)));
  }
}

/**
 * Form submission handler for cvl_visualization_admin_form().
 *
 * @see cvl_visualization_admin_form_validate()
 * @see cvl_visualization_admin_form_delete_submit()
 */
function cvl_visualization_admin_form_submit($form, &$form_state) {
  // Remove unnecessary values.
  form_state_values_clean($form_state);

  cvl_visualization_save($form_state['values']);

  drupal_set_message(t('The alias has been saved.'));
  $form_state['redirect'] = 'admin/config/search/cvl_visualization';
}

/**
 * Form constructor for the cvl_visualization deletion form.
 *
 * @param $cvl_visualization
 *   The cvl_visualization alias that will be deleted.
 *
 * @see cvl_visualization_admin_delete_confirm_submit()
 */
function cvl_visualization_admin_delete_confirm($form, &$form_state, $cvl_visualization) {
  if (user_access('administer url aliases')) {
    $form_state['cvl_visualization'] = $cvl_visualization;
    return confirm_form(
      $form,
      t('Are you sure you want to delete cvl_visualization alias %title?',
      array('%title' => $cvl_visualization['alias'])),
      'admin/config/search/cvl_visualization'
    );
  }
  return array();
}

/**
 * Form submission handler for cvl_visualization_admin_delete_confirm().
 */
function cvl_visualization_admin_delete_confirm_submit($form, &$form_state) {
  if ($form_state['values']['confirm']) {
    cvl_visualization_delete($form_state['cvl_visualization']['pid']);
    $form_state['redirect'] = 'admin/config/search/cvl_visualization';
  }
}

/**
 * Form constructor for the cvl_visualization admin overview filter form.
 *
 * @ingroup forms
 * @see cvl_visualization_admin_filter_form_submit_filter()
 * @see cvl_visualization_admin_filter_form_submit_reset()
 */
function cvl_visualization_admin_filter_form($form, &$form_state, $keys = '') {
  $form['#attributes'] = array('class' => array('search-form'));
  $form['basic'] = array('#type' => 'fieldset',
    '#title' => t('Filter aliases'),
    '#attributes' => array('class' => array('container-inline')),
  );
  $form['basic']['filter'] = array(
    '#type' => 'textfield',
    '#title' => 'Path alias',
    '#title_display' => 'invisible',
    '#default_value' => $keys,
    '#maxlength' => 128,
    '#size' => 25,
  );
  $form['basic']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Filter'),
    '#submit' => array('cvl_visualization_admin_filter_form_submit_filter'),
    );
  if ($keys) {
    $form['basic']['reset'] = array(
      '#type' => 'submit',
      '#value' => t('Reset'),
      '#submit' => array('cvl_visualization_admin_filter_form_submit_reset'),
    );
  }
  return $form;
}

/**
 * Form submission handler for the cvl_visualization_admin_filter_form() Filter button.
 *
 * @see cvl_visualization_admin_filter_form_submit_reset()
 */
function cvl_visualization_admin_filter_form_submit_filter($form, &$form_state) {
  $form_state['redirect'] = 'admin/config/search/cvl_visualization/list/' . trim($form_state['values']['filter']);
}

/**
 * Form submission handler for the cvl_visualization_admin_filter_form() Reset button.
 *
 * @see cvl_visualization_admin_filter_form_submit_filter()
 */
function cvl_visualization_admin_filter_form_submit_reset($form, &$form_state) {
  $form_state['redirect'] = 'admin/config/search/cvl_visualization/list';
}
