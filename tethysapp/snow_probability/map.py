from django.shortcuts import render
from django.http import JsonResponse

import json
import datetime

def map(request):
    """
    Controller for map page.
    """
    
    #configure the date picker
    today = datetime.date.today()
    date_picker = {'display_text': 'Date',
        'name': 'date',
        'autoclose': True,
        'format': 'yyyy-mm-dd',
        'start_date': '2013-01-01',
        'today_button': True,
        'initial': datetime.datetime.today().strftime("%Y-%m-%d")
    }

    days_picker = {'display_text': 'Number of days:',
              'name': 'inputDays',
              'placeholder': '100'}

    # Pre-populate lat-picker and lon_picker from model
    lat_picker = {'display_text': 'Latitude:',
              'name': 'inputLat'}

    lon_picker = {'display_text': 'Longitude:',
              'name': 'inputLon'}

    
    # Pass variables to the template via the context dictionary
    context = {'date_picker':date_picker,
               'days_picker':days_picker,
               'lon_picker':lon_picker,
               'lat_picker':lat_picker}
    
    return render(request, 'snow_probability/openlayers_map.html', context)


