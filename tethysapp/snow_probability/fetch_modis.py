# -*- coding: utf-8 -*-
"""
Created on Wed Oct 15 22:18:08 2014

@author: Jiri
Fetch time-series of snow coverage
from the MODIS_TERRA GIBS WMTS
Requires: pyPNG
"""

import math
import datetime
import png
import urllib2
import pandas as pd 
import numpy as np   
"""
Convert (lat, lon) to the proper tile number
Taken from http://wiki.openstreetmap.org/wiki/Tilenames#Lon..2Flat._to_tile_numbers_2
"""
def deg2num(lat_deg, lon_deg, zoom):
    tileSize = 256;
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtilef = (lon_deg + 180.0) / 360.0 * n
    xtile = int(xtilef)
    xpixel = int((xtilef - float(xtile)) * tileSize)
    ytilef = (1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n
    ytile = int(ytilef)
    ypixel = int((ytilef -float(ytile)) * tileSize)
    return (xtile, ytile, xpixel, ypixel)
    

def getTileURL(xtile, ytile, zoom, date):
    baseURL = 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/' + \
    '{0}/default/{1}/{2}/{3}/{4}/{5}.png'
    layer = 'MODIS_Terra_Snow_Cover'
    tileMatrix = 'GoogleMapsCompatible_Level8'
    time = date.strftime("%Y-%m-%d")
    zoom = 8
    return baseURL.format(layer, time, tileMatrix, zoom, ytile, xtile)
    
        

    
def getTimeSeries(lat, lon, beginDate, endDate):
    datelist = pd.date_range(beginDate, endDate)
    zoom = 8
    xtile, ytile, xpixel, ypixel = deg2num(lat, lon, zoom)
    ts = []
    for d in datelist:        
        url = getTileURL(xtile, ytile, zoom, d)
        print url
        snow_val = getImage(url, ypixel, xpixel)
        if snow_val > 100:
            snow_val = np.nan
        ts.append(snow_val)
    return ts
    
    
def getImage(url, rowpixel, colpixel):
    r = png.Reader(file=urllib2.urlopen(url))
    w, h, pixels, metadata = r.read()
    pxlist = list(pixels)
    return pxlist[rowpixel][colpixel]

#test for provo peak
lat1 = 40.2460
lon1 = -111.5573
        
#test for byu
lat = 40.2455
lon = -111.6500

import matplotlib.pyplot as plt
beginDate = datetime.date(2014,10,1)
endDate = datetime.date(2015, 1, 21)
datelist = pd.date_range(beginDate, endDate)
v = getTimeSeries(lat1, lon1, beginDate, endDate)
fig = plt.figure()
ax = fig.add_subplot(111)
ax.plot(datelist, v, 'ro')
ax.plot(datelist, v, 'r--')
#ax.fill_between(datelist, 0, v)

# Make space for and rotate the x-axis tick labels
fig.autofmt_xdate()

fig.savefig("modis.png")
