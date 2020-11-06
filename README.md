# CVL visualization module
Author: Lara Ferrighi, laraf@met.no, Magnar Martinsen, magnarem@met.no

This is a Drupal 8 custom module to visualize selected products on a OL6 map.

## How to install the module
* Download the module and place it within the module folder.
* Configure the module in the configuration page (/admin/config/services/cvl_visualization)
* Create a basic page with a URL alias (for example "data-visualization")
* Activate the data visualization block to be visible in the content area of the above mentioned page


## Dependencies
Openlayers6 (https://github.com/openlayers/openlayers/releases/tag/v6.3.1) should be downloaded and installed in the libraries folder under the name "openlayers6"
jquery_update should be installed

### TODO:
* Switch to Solarium PHP insted of custom HttpConnection_cvl Class
