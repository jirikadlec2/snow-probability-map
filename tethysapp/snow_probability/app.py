from tethys_apps.base import TethysAppBase, url_map_maker
from tethys_apps.base import PersistentStore


class SnowProbability(TethysAppBase):
    """
    Tethys app class for Snow Probability.
    """

    name = 'Snow Probability Map'
    index = 'snow_probability:home'
    icon = 'snow_probability/images/icon.gif'
    package = 'snow_probability'
    root_url = 'snow-probability'
    color = '#9b59b6'
    description = 'Check the snow cover probability in Czechia.'
        
    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='snow-probability',
                           controller='snow_probability.map.map'),
                    UrlMap(name='snow_graph',
                           url='snow-probability/snow_graph',
                           controller='snow_probability.controllers.snow_graph'),
                    UrlMap(name='snow_data',
                           url='snow-probability/snow_data',
                           controller='snow_probability.modis.get_data_json'),
                    UrlMap(name='waterml',
                           url='snow-probability/waterml',
                           controller='snow_probability.modis.get_data_waterml'),
                    UrlMap(name='pixel',
                           url='snow-probability/pixel',
                           controller='snow_probability.modis.get_data_for_pixel'),
                    UrlMap(name='pixel-borders',
                           url='snow-probability/pixel-borders',
                           controller='snow_probability.modis.get_pixel_borders2'),
                    UrlMap(name='upload_to_hydroshare_ajax',
                           url='snow-probability/upload-to-hydroshare',
                           controller='snow_probability.controllers.upload_to_hydroshare')
        )

        return url_maps


    def persistent_stores(self):
        """
        Add one or more persistent stores
        """
        stores = (PersistentStore(name='snow_probability_db',
                                  initializer='init_stores:init_snow_probability_db',
                                  spatial=True),
        )
        return stores
