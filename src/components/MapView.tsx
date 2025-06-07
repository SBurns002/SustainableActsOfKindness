import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle, Search, MapPin, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { eventDataManager } from '../lib/eventDataManager';
import DateRangeFilter from './DateRangeFilter';
import MapLegend from './MapLegend';
import { filterCleanupDataByDateRange, filterCleanupDataByEventType } from '../utils/filterUtils';
import 'leaflet/dist/leaflet.css';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Enhanced geocoding function with comprehensive Massachusetts zip codes
const getLocationCoordinates = (location: string): [number, number] | null => {
  const cleanLocation = location.trim().toLowerCase();
  
  // Comprehensive Massachusetts zip code mapping
  const zipCodeMap: { [key: string]: [number, number] } = {
    // Boston Area
    '02101': [42.3601, -71.0589], // Boston - Financial District
    '02102': [42.3601, -71.0589], // Boston - Financial District
    '02103': [42.3601, -71.0589], // Boston - Financial District
    '02104': [42.3601, -71.0589], // Boston - Financial District
    '02105': [42.3601, -71.0589], // Boston - Financial District
    '02106': [42.3601, -71.0589], // Boston - Financial District
    '02107': [42.3601, -71.0589], // Boston - Financial District
    '02108': [42.3601, -71.0589], // Boston - Beacon Hill
    '02109': [42.3647, -71.0542], // Boston - North End
    '02110': [42.3601, -71.0589], // Boston - Financial District
    '02111': [42.3467, -71.0972], // Boston - Chinatown
    '02112': [42.3467, -71.0972], // Boston - South End
    '02113': [42.3647, -71.0542], // Boston - North End
    '02114': [42.3601, -71.0589], // Boston - Beacon Hill
    '02115': [42.3467, -71.0972], // Boston - Back Bay
    '02116': [42.3467, -71.0972], // Boston - Back Bay
    '02117': [42.3467, -71.0972], // Boston - Back Bay
    '02118': [42.3467, -71.0972], // Boston - South End
    '02119': [42.3188, -71.0846], // Boston - Roxbury
    '02120': [42.3188, -71.0846], // Boston - Mission Hill
    '02121': [42.3188, -71.0846], // Boston - Roxbury
    '02122': [42.3188, -71.0846], // Boston - Dorchester
    '02123': [42.3188, -71.0846], // Boston - Dorchester
    '02124': [42.3188, -71.0846], // Boston - Dorchester
    '02125': [42.3188, -71.0846], // Boston - Dorchester
    '02126': [42.3188, -71.0846], // Boston - Mattapan
    '02127': [42.3188, -71.0846], // Boston - South Boston
    '02128': [42.3188, -71.0846], // Boston - East Boston
    '02129': [42.3875, -71.0995], // Boston - Charlestown
    '02130': [42.3188, -71.0846], // Boston - Jamaica Plain
    '02131': [42.3188, -71.0846], // Boston - Roslindale
    '02132': [42.3188, -71.0846], // Boston - West Roxbury
    '02133': [42.3188, -71.0846], // Boston - Roslindale
    '02134': [42.3188, -71.0846], // Boston - Allston
    '02135': [42.3188, -71.0846], // Boston - Brighton
    '02136': [42.3188, -71.0846], // Boston - Hyde Park
    '02137': [42.3188, -71.0846], // Boston - Readville
    '02138': [42.3736, -71.1097], // Cambridge
    '02139': [42.3736, -71.1097], // Cambridge
    '02140': [42.3736, -71.1097], // Cambridge
    '02141': [42.3736, -71.1097], // Cambridge
    '02142': [42.3736, -71.1097], // Cambridge
    '02143': [42.3875, -71.0995], // Somerville
    '02144': [42.3875, -71.0995], // Somerville
    '02145': [42.3875, -71.0995], // Somerville
    '02146': [42.3188, -71.0846], // Brookline
    '02147': [42.3188, -71.0846], // Brookline
    '02148': [42.4184, -71.0275], // Malden
    '02149': [42.4184, -71.0275], // Everett
    '02150': [42.4184, -71.0275], // Chelsea
    '02151': [42.4184, -71.0275], // Revere
    '02152': [42.4184, -71.0275], // Winthrop
    '02153': [42.4184, -71.0275], // Medford
    '02154': [42.4184, -71.0275], // Medford
    '02155': [42.4184, -71.0275], // Medford
    '02156': [42.4184, -71.0275], // West Medford
    '02157': [42.4184, -71.0275], // West Medford
    '02158': [42.4751, -71.1056], // Newton
    '02159': [42.4751, -71.1056], // Newton
    '02160': [42.4751, -71.1056], // Newton
    '02161': [42.4751, -71.1056], // Newton
    '02162': [42.4751, -71.1056], // Newton
    '02163': [42.4751, -71.1056], // Newton
    '02164': [42.4751, -71.1056], // Newton
    '02165': [42.4751, -71.1056], // Newton
    '02166': [42.4751, -71.1056], // Newton
    '02167': [42.4751, -71.1056], // Newton
    '02168': [42.4751, -71.1056], // Newton
    '02169': [42.2751, -71.0275], // Quincy
    '02170': [42.2751, -71.0275], // Quincy
    '02171': [42.2751, -71.0275], // Quincy
    '02172': [42.2751, -71.0275], // Quincy
    '02173': [42.2751, -71.0275], // Quincy
    '02174': [42.4184, -71.0275], // Arlington
    '02175': [42.4184, -71.0275], // Arlington
    '02176': [42.4184, -71.0275], // Arlington
    '02177': [42.4184, -71.0275], // Arlington
    '02178': [42.4184, -71.0275], // Belmont
    '02179': [42.4184, -71.0275], // Belmont
    '02180': [42.4751, -71.1056], // Stoneham
    '02181': [42.4751, -71.1056], // Wellesley
    '02182': [42.4751, -71.1056], // Wellesley
    '02183': [42.4751, -71.1056], // Waltham
    '02184': [42.4751, -71.1056], // Braintree
    '02185': [42.4751, -71.1056], // Braintree
    '02186': [42.2751, -71.0275], // Milton
    '02187': [42.2751, -71.0275], // Milton
    '02188': [42.2751, -71.0275], // Weymouth
    '02189': [42.2751, -71.0275], // East Weymouth
    '02190': [42.2751, -71.0275], // South Weymouth
    '02191': [42.2751, -71.0275], // Weymouth
    '02192': [42.4751, -71.1056], // Needham
    '02193': [42.4751, -71.1056], // Weston
    '02194': [42.4751, -71.1056], // Needham
    '02195': [42.4751, -71.1056], // Babson Park
    '02196': [42.2751, -71.0275], // Hingham
    '02197': [42.2751, -71.0275], // Hingham
    '02199': [42.3467, -71.0972], // Boston - Back Bay
    '02201': [42.3601, -71.0589], // Boston - Government Center
    '02203': [42.3601, -71.0589], // Boston - Government Center
    '02204': [42.3601, -71.0589], // Boston - Government Center
    '02205': [42.3601, -71.0589], // Boston - Government Center
    '02206': [42.3601, -71.0589], // Boston - Government Center
    '02207': [42.3601, -71.0589], // Boston - Government Center
    '02208': [42.3601, -71.0589], // Boston - Government Center
    '02209': [42.3601, -71.0589], // Boston - Government Center
    '02210': [42.3467, -71.0972], // Boston - South Boston
    '02211': [42.3467, -71.0972], // Boston - South Boston
    '02212': [42.3467, -71.0972], // Boston - South Boston
    '02215': [42.3467, -71.0972], // Boston - Fenway
    '02216': [42.3467, -71.0972], // Boston - Back Bay
    '02217': [42.3467, -71.0972], // Boston - Back Bay
    '02222': [42.3601, -71.0589], // Boston - Prudential
    '02228': [42.3188, -71.0846], // Boston - East Boston
    '02238': [42.3736, -71.1097], // Cambridge - Harvard
    '02239': [42.3736, -71.1097], // Cambridge - Harvard
    '02266': [42.3601, -71.0589], // Boston - Longwood
    '02283': [42.3601, -71.0589], // Boston - Longwood
    '02284': [42.3601, -71.0589], // Boston - Longwood
    '02293': [42.3601, -71.0589], // Boston - Longwood
    '02295': [42.3601, -71.0589], // Boston - Longwood
    '02297': [42.3601, -71.0589], // Boston - Longwood
    '02298': [42.3601, -71.0589], // Boston - Longwood
    '02299': [42.3601, -71.0589], // Boston - Longwood

    // South Shore (including missing zip codes)
    '02301': [42.1584, -70.9342], // Brockton
    '02302': [42.1584, -70.9342], // Brockton
    '02303': [42.1584, -70.9342], // Brockton
    '02304': [42.1584, -70.9342], // Brockton
    '02305': [42.1584, -70.9342], // Brockton
    '02322': [42.0751, -70.8342], // Avon
    '02324': [42.0751, -70.8342], // Bridgewater
    '02325': [42.0751, -70.8342], // Bridgewater
    '02330': [42.1626, -70.9342], // Carver
    '02331': [42.2084, -70.8342], // Duxbury
    '02332': [42.2084, -70.8342], // Duxbury
    '02333': [42.1084, -70.8342], // East Bridgewater
    '02334': [42.0584, -70.8342], // Easton
    '02337': [42.1084, -70.8342], // Elmwood
    '02338': [42.1084, -70.8342], // Halifax
    '02339': [42.2084, -70.8342], // Hanover
    '02340': [42.2084, -70.8342], // Hanover
    '02341': [42.2084, -70.8342], // Hanson
    '02343': [42.1084, -70.8342], // Holbrook
    '02344': [42.1084, -70.8342], // Middleborough
    '02345': [42.1084, -70.8342], // Middleborough
    '02346': [42.1084, -70.8342], // Middleborough
    '02347': [42.1084, -70.8342], // Lakeville
    '02348': [42.1084, -70.8342], // Lakeville
    '02349': [42.1084, -70.8342], // Marshfield
    '02350': [42.1084, -70.8342], // Marshfield
    '02351': [42.1084, -70.8342], // Abington
    '02355': [42.1084, -70.8342], // North Carver
    '02356': [42.1084, -70.8342], // North Easton
    '02357': [42.1084, -70.8342], // North Marshfield
    '02358': [42.1084, -70.8342], // Pembroke
    '02359': [42.1084, -70.8342], // Pembroke
    '02360': [42.1084, -70.8342], // Plymouth
    '02361': [42.1084, -70.8342], // Plymouth
    '02362': [42.1084, -70.8342], // Plymouth
    '02364': [42.1084, -70.8342], // Kingston
    '02366': [42.1084, -70.8342], // South Easton
    '02367': [42.1084, -70.8342], // Plympton
    '02368': [42.1626, -70.9342], // Randolph
    '02370': [42.1084, -70.8342], // Rockland
    '02375': [42.1084, -70.8342], // South Easton
    '02379': [42.1084, -70.8342], // West Bridgewater
    '02381': [42.1084, -70.8342], // Whitman

    // North Shore
    '01970': [42.5195, -70.8967], // Salem
    '01971': [42.5195, -70.8967], // Salem
    '01940': [42.5584, -70.8648], // Lynnfield
    '01944': [42.4751, -70.9494], // Manchester-by-the-Sea
    '01945': [42.4751, -70.9494], // Marblehead
    '01949': [42.4751, -70.9494], // Middleton
    '01950': [42.5584, -70.8648], // Newburyport
    '01951': [42.5584, -70.8648], // Newbury
    '01952': [42.5584, -70.8648], // Salisbury
    '01960': [42.4751, -70.9494], // Peabody
    '01961': [42.4751, -70.9494], // Peabody
    '01965': [42.4751, -70.9494], // Beverly
    '01966': [42.4751, -70.9494], // Rockport
    '01969': [42.4751, -70.9494], // Rowley
    '01982': [42.4751, -70.9494], // Hamilton
    '01983': [42.4751, -70.9494], // Topsfield
    '01984': [42.4751, -70.9494], // Wenham
    '01985': [42.4751, -70.9494], // West Newbury

    // South Shore continued
    '02703': [41.9465, -71.2928], // Attleboro
    '02760': [41.9676, -71.3495], // North Attleborough
    '02761': [41.9676, -71.3495], // North Attleborough
    '02762': [41.9676, -71.3495], // Plainville
    '02763': [41.9676, -71.3495], // Attleboro
    '02764': [41.9676, -71.3495], // Norton
    '02766': [41.9676, -71.3495], // Norton
    '02767': [41.9676, -71.3495], // Rehoboth
    '02768': [41.9676, -71.3495], // Seekonk
    '02769': [41.9676, -71.3495], // Swansea
    '02770': [41.9676, -71.3495], // Rochester
    '02771': [41.9676, -71.3495], // Seekonk
    '02777': [41.9676, -71.3495], // Swansea
    '02780': [41.6362, -71.1097], // Taunton
    '02783': [41.6362, -71.1097], // Taunton
    '02790': [41.6362, -71.1097], // Westport
    '02791': [41.6362, -71.1097], // Westport Point

    // Cape Cod
    '02601': [41.6362, -70.2962], // Hyannis
    '02630': [41.6362, -70.2962], // Barnstable
    '02631': [41.6362, -70.2962], // Brewster
    '02632': [41.6362, -70.2962], // Centerville
    '02633': [41.6362, -70.2962], // Chatham
    '02634': [41.6362, -70.2962], // Dennis
    '02635': [41.6362, -70.2962], // East Dennis
    '02636': [41.6362, -70.2962], // East Harwich
    '02637': [41.6362, -70.2962], // East Orleans
    '02638': [41.6362, -70.2962], // East Sandwich
    '02639': [41.6362, -70.2962], // East Wareham
    '02641': [41.6362, -70.2962], // Forestdale
    '02642': [41.6362, -70.2962], // Harwich
    '02643': [41.6362, -70.2962], // Harwich Port
    '02644': [41.6362, -70.2962], // Hyannis Port
    '02645': [41.6362, -70.2962], // Mashpee
    '02646': [41.6362, -70.2962], // Marstons Mills
    '02647': [41.6362, -70.2962], // North Chatham
    '02648': [41.6362, -70.2962], // North Eastham
    '02649': [41.6362, -70.2962], // North Falmouth
    '02650': [41.6362, -70.2962], // North Truro
    '02651': [41.6362, -70.2962], // North Eastham
    '02652': [41.6362, -70.2962], // North Falmouth
    '02653': [41.6362, -70.2962], // Orleans
    '02655': [41.6362, -70.2962], // Osterville
    '02657': [41.6362, -70.2962], // Provincetown
    '02659': [41.6362, -70.2962], // Sagamore
    '02660': [41.6362, -70.2962], // Sagamore Beach
    '02661': [41.6362, -70.2962], // Sandwich
    '02662': [41.6362, -70.2962], // Sandwich
    '02663': [41.6362, -70.2962], // Sagamore Beach
    '02664': [41.6362, -70.2962], // South Chatham
    '02666': [41.6362, -70.2962], // South Dennis
    '02667': [41.9342, -69.9723], // Wellfleet
    '02668': [41.6362, -70.2962], // South Harwich
    '02669': [41.6362, -70.2962], // South Orleans
    '02670': [41.6362, -70.2962], // South Yarmouth
    '02671': [41.6362, -70.2962], // Truro
    '02672': [41.6362, -70.2962], // Wareham
    '02673': [41.6362, -70.2962], // West Barnstable
    '02674': [41.6362, -70.2962], // West Chatham
    '02675': [41.6362, -70.2962], // West Dennis
    '02676': [41.6362, -70.2962], // West Falmouth
    '02677': [41.6362, -70.2962], // West Harwich
    '02678': [41.6362, -70.2962], // West Hyannisport
    '02679': [41.6362, -70.2962], // West Yarmouth
    '02680': [41.6362, -70.2962], // Woods Hole
    '02681': [41.6362, -70.2962], // West Dennis
    '02682': [41.6362, -70.2962], // Yarmouth
    '02684': [41.6362, -70.2962], // Yarmouth Port

    // Western Massachusetts
    '01001': [42.2751, -72.4009], // Agawam
    '01002': [42.2751, -72.4009], // Amherst
    '01003': [42.2751, -72.4009], // Amherst
    '01004': [42.2751, -72.4009], // Amherst
    '01005': [42.2751, -72.4009], // Barre
    '01007': [42.2751, -72.4009], // Belchertown
    '01008': [42.2751, -72.4009], // Blandford
    '01009': [42.2751, -72.4009], // Bondsville
    '01010': [42.2751, -72.4009], // Brimfield
    '01011': [42.2751, -72.4009], // Chester
    '01012': [42.2751, -72.4009], // Chesterfield
    '01013': [42.2751, -72.4009], // Chicopee
    '01014': [42.2751, -72.4009], // Chicopee
    '01020': [42.2751, -72.4009], // Chicopee
    '01021': [42.2751, -72.4009], // Chicopee
    '01022': [42.2751, -72.4009], // Chicopee
    '01026': [42.2751, -72.4009], // Cummington
    '01027': [42.2751, -72.4009], // Easthampton
    '01028': [42.2751, -72.4009], // East Longmeadow
    '01029': [42.2751, -72.4009], // East Otis
    '01030': [42.2751, -72.4009], // Feeding Hills
    '01031': [42.2751, -72.4009], // Gilbertville
    '01032': [42.2751, -72.4009], // Goshen
    '01033': [42.2751, -72.4009], // Granby
    '01034': [42.2751, -72.4009], // Granville
    '01035': [42.2751, -72.4009], // Hadley
    '01036': [42.2751, -72.4009], // Hampden
    '01037': [42.2751, -72.4009], // Hardwick
    '01038': [42.2751, -72.4009], // Hatfield
    '01039': [42.2751, -72.4009], // Haydenville
    '01040': [42.2751, -72.4009], // Holyoke
    '01041': [42.2751, -72.4009], // Holyoke
    '01050': [42.2751, -72.4009], // Huntington
    '01053': [42.2751, -72.4009], // Leeds
    '01054': [42.2751, -72.4009], // Leverett
    '01056': [42.2751, -72.4009], // Ludlow
    '01057': [42.2751, -72.4009], // Monson
    '01059': [42.2751, -72.4009], // North Amherst
    '01060': [42.2751, -72.4009], // Northampton
    '01061': [42.2751, -72.4009], // Northampton
    '01062': [42.2751, -72.4009], // Florence
    '01063': [42.2751, -72.4009], // Northampton
    '01066': [42.2751, -72.4009], // Northfield
    '01068': [42.2751, -72.4009], // Oakham
    '01069': [42.2751, -72.4009], // Palmer
    '01070': [42.2751, -72.4009], // Plainfield
    '01071': [42.2751, -72.4009], // Russell
    '01072': [42.2751, -72.4009], // Shutesbury
    '01073': [42.2751, -72.4009], // Southampton
    '01074': [42.2751, -72.4009], // South Hadley
    '01075': [42.2751, -72.4009], // South Hadley
    '01077': [42.2751, -72.4009], // Southwick
    '01079': [42.2751, -72.4009], // Three Rivers
    '01080': [42.2751, -72.4009], // Three Rivers
    '01081': [42.2751, -72.4009], // Wales
    '01082': [42.2751, -72.4009], // Ware
    '01083': [42.2751, -72.4009], // Warren
    '01084': [42.2751, -72.4009], // West Chesterfield
    '01085': [42.2751, -72.4009], // Westfield
    '01086': [42.2751, -72.4009], // Westfield
    '01088': [42.2751, -72.4009], // West Hatfield
    '01089': [42.2751, -72.4009], // West Springfield
    '01090': [42.2751, -72.4009], // West Springfield
    '01092': [42.2751, -72.4009], // West Warren
    '01093': [42.2751, -72.4009], // Whately
    '01094': [42.2751, -72.4009], // Williamsburg
    '01095': [42.2751, -72.4009], // Wilbraham
    '01096': [42.2751, -72.4009], // Williamsburg
    '01097': [42.2751, -72.4009], // Woronoco
    '01098': [42.2751, -72.4009], // Worthington

    // Berkshire County
    '01201': [42.6334, -73.1673], // Pittsfield
    '01202': [42.6334, -73.1673], // Pittsfield
    '01203': [42.6334, -73.1673], // Pittsfield
    '01220': [42.6334, -73.1673], // Adams
    '01222': [42.6334, -73.1673], // Ashley Falls
    '01223': [42.6334, -73.1673], // Becket
    '01224': [42.6334, -73.1673], // Berkshire
    '01225': [42.6334, -73.1673], // Cheshire
    '01226': [42.6334, -73.1673], // Dalton
    '01227': [42.6334, -73.1673], // Dell
    '01229': [42.6334, -73.1673], // Great Barrington
    '01230': [42.6334, -73.1673], // Great Barrington
    '01235': [42.6334, -73.1673], // Hinsdale
    '01236': [42.6334, -73.1673], // Housatonic
    '01237': [42.6334, -73.1673], // Lanesborough
    '01238': [42.6334, -73.1673], // Lee
    '01240': [42.6334, -73.1673], // Lenox
    '01242': [42.6334, -73.1673], // Lenox Dale
    '01243': [42.6334, -73.1673], // Middlefield
    '01244': [42.6334, -73.1673], // Mill River
    '01245': [42.6334, -73.1673], // Monterey
    '01247': [42.6334, -73.1673], // North Adams
    '01252': [42.6334, -73.1673], // North Egremont
    '01253': [42.6334, -73.1673], // Otis
    '01254': [42.6334, -73.1673], // Richmond
    '01255': [42.6334, -73.1673], // Sandisfield
    '01256': [42.6334, -73.1673], // Savoy
    '01257': [42.6334, -73.1673], // Sheffield
    '01258': [42.6334, -73.1673], // South Egremont
    '01259': [42.6334, -73.1673], // Southfield
    '01260': [42.6334, -73.1673], // South Lee
    '01262': [42.6334, -73.1673], // Stockbridge
    '01263': [42.6334, -73.1673], // Tyringham
    '01264': [42.6334, -73.1673], // Washington
    '01266': [42.6334, -73.1673], // West Stockbridge
    '01267': [42.6334, -73.1673], // Williamstown
    '01270': [42.6334, -73.1673], // Windsor

    // Central Massachusetts
    '01420': [42.4370, -71.3495], // Fitchburg
    '01430': [42.4370, -71.3495], // Ashburnham
    '01431': [42.4370, -71.3495], // Ashby
    '01432': [42.4370, -71.3495], // Ayer
    '01434': [42.4370, -71.3495], // Devens
    '01435': [42.4370, -71.3495], // Groton
    '01436': [42.4370, -71.3495], // Baldwinville
    '01438': [42.4370, -71.3495], // Groton
    '01440': [42.4370, -71.3495], // Gardner
    '01441': [42.4370, -71.3495], // Westminster
    '01450': [42.4370, -71.3495], // Groton
    '01451': [42.4370, -71.3495], // Harvard
    '01452': [42.4370, -71.3495], // Hubbardston
    '01453': [42.4370, -71.3495], // Leominster
    '01460': [42.4370, -71.3495], // Littleton
    '01462': [42.4370, -71.3495], // Lunenburg
    '01463': [42.4370, -71.3495], // Pepperell
    '01464': [42.4370, -71.3495], // Shirley
    '01467': [42.4370, -71.3495], // Still River
    '01468': [42.4370, -71.3495], // Templeton
    '01469': [42.4370, -71.3495], // Townsend
    '01470': [42.4370, -71.3495], // Groton
    '01471': [42.4370, -71.3495], // Groton
    '01472': [42.4370, -71.3495], // West Groton
    '01473': [42.4370, -71.3495], // Westminster
    '01474': [42.4370, -71.3495], // West Townsend
    '01475': [42.4370, -71.3495], // Winchendon
    '01477': [42.4370, -71.3495], // Winchendon Springs

    // MetroWest
    '01701': [42.3009, -71.3495], // Framingham
    '01702': [42.3009, -71.3495], // Framingham
    '01703': [42.3009, -71.3495], // Framingham
    '01704': [42.3009, -71.3495], // Framingham
    '01705': [42.3009, -71.3495], // Framingham
    '01718': [42.3009, -71.3495], // Acton
    '01719': [42.3009, -71.3495], // Boxborough
    '01720': [42.3009, -71.3495], // Acton
    '01721': [42.3009, -71.3495], // Ashland
    '01730': [42.3009, -71.3495], // Bedford
    '01731': [42.3009, -71.3495], // Hanscom AFB
    '01740': [42.3009, -71.3495], // Bolton
    '01741': [42.3009, -71.3495], // Carlisle
    '01742': [42.4370, -71.3495], // Concord
    '01745': [42.3009, -71.3495], // Fayville
    '01746': [42.3009, -71.3495], // Holliston
    '01747': [42.3009, -71.3495], // Hopedale
    '01748': [42.3009, -71.3495], // Hopkinton
    '01749': [42.3009, -71.3495], // Hudson
    '01752': [42.3009, -71.3495], // Marlborough
    '01754': [42.3009, -71.3495], // Maynard
    '01756': [42.3009, -71.3495], // Mendon
    '01757': [42.3009, -71.3495], // Milford
    '01760': [42.3009, -71.3495], // Natick
    '01770': [42.3009, -71.3495], // Sherborn
    '01772': [42.3009, -71.3495], // Southborough
    '01773': [42.3009, -71.3495], // Lincoln
    '01775': [42.3009, -71.3495], // Stow
    '01776': [42.3009, -71.3495], // Sudbury
    '01778': [42.3009, -71.3495], // Wayland

    // Other major cities
    '10001': [40.7505, -73.9934], // New York, NY
    '90210': [34.0901, -118.4065], // Beverly Hills, CA
    '60614': [41.9278, -87.6431], // Chicago, IL
    '33034': [25.4587, -80.4776], // Homestead, FL
    '75218': [32.8140, -96.7236], // Dallas, TX
    '59936': [48.7596, -113.7870], // West Glacier, MT
    '11201': [40.6892, -73.9442], // Brooklyn, NY
    '85008': [33.4734, -112.0740], // Phoenix, AZ
    '98199': [47.6587, -122.4058], // Seattle, WA
    '97204': [45.5152, -122.6784], // Portland, OR
    '78746': [30.2672, -97.7431], // Austin, TX
  };

  // City + State mapping with Massachusetts cities
  const cityStateMap: { [key: string]: [number, number] } = {
    // Massachusetts cities
    'boston, ma': [42.3601, -71.0589],
    'boston, massachusetts': [42.3601, -71.0589],
    'cambridge, ma': [42.3736, -71.1097],
    'cambridge, massachusetts': [42.3736, -71.1097],
    'somerville, ma': [42.3875, -71.0995],
    'somerville, massachusetts': [42.3875, -71.0995],
    'salem, ma': [42.5195, -70.8967],
    'salem, massachusetts': [42.5195, -70.8967],
    'lynn, ma': [42.4668, -70.9495],
    'lynn, massachusetts': [42.4668, -70.9495],
    'lowell, ma': [42.6334, -71.3162],
    'lowell, massachusetts': [42.6334, -71.3162],
    'brockton, ma': [42.0834, -71.0184],
    'brockton, massachusetts': [42.0834, -71.0184],
    'quincy, ma': [42.2529, -71.0023],
    'quincy, massachusetts': [42.2529, -71.0023],
    'newton, ma': [42.3370, -71.2092],
    'newton, massachusetts': [42.3370, -71.2092],
    'lawrence, ma': [42.7070, -71.1631],
    'lawrence, massachusetts': [42.7070, -71.1631],
    'fall river, ma': [41.7015, -71.1550],
    'fall river, massachusetts': [41.7015, -71.1550],
    'waltham, ma': [42.3765, -71.2356],
    'waltham, massachusetts': [42.3765, -71.2356],
    'malden, ma': [42.4251, -71.0662],
    'malden, massachusetts': [42.4251, -71.0662],
    'brookline, ma': [42.3318, -71.1211],
    'brookline, massachusetts': [42.3318, -71.1211],
    'medford, ma': [42.4184, -71.1061],
    'medford, massachusetts': [42.4184, -71.1061],
    'taunton, ma': [41.9001, -71.0897],
    'taunton, massachusetts': [41.9001, -71.0897],
    'chicopee, ma': [42.1487, -72.6078],
    'chicopee, massachusetts': [42.1487, -72.6078],
    'weymouth, ma': [42.2180, -70.9395],
    'weymouth, massachusetts': [42.2180, -70.9395],
    'revere, ma': [42.4085, -71.0119],
    'revere, massachusetts': [42.4085, -71.0119],
    'peabody, ma': [42.5278, -70.9286],
    'peabody, massachusetts': [42.5278, -70.9286],
    'methuen, ma': [42.7262, -71.1909],
    'methuen, massachusetts': [42.7262, -71.1909],
    'barnstable, ma': [41.7003, -70.3002],
    'barnstable, massachusetts': [41.7003, -70.3002],
    'pittsfield, ma': [42.4501, -73.2453],
    'pittsfield, massachusetts': [42.4501, -73.2453],
    'springfield, ma': [42.1015, -72.5898],
    'springfield, massachusetts': [42.1015, -72.5898],
    'holyoke, ma': [42.2043, -72.6162],
    'holyoke, massachusetts': [42.2043, -72.6162],
    'worcester, ma': [42.2626, -71.8023],
    'worcester, massachusetts': [42.2626, -71.8023],
    'framingham, ma': [42.2793, -71.4162],
    'framingham, massachusetts': [42.2793, -71.4162],
    'haverhill, ma': [42.7762, -71.0773],
    'haverhill, massachusetts': [42.7762, -71.0773],
    'marlborough, ma': [42.3459, -71.5523],
    'marlborough, massachusetts': [42.3459, -71.5523],
    'attleboro, ma': [41.9465, -71.2928],
    'attleboro, massachusetts': [41.9465, -71.2928],
    'north attleborough, ma': [41.9676, -71.3495],
    'north attleborough, massachusetts': [41.9676, -71.3495],
    'concord, ma': [42.4604, -71.3489],
    'concord, massachusetts': [42.4604, -71.3489],
    'lexington, ma': [42.4430, -71.2289],
    'lexington, massachusetts': [42.4430, -71.2289],
    'wellesley, ma': [42.2968, -71.2962],
    'wellesley, massachusetts': [42.2968, -71.2962],
    'needham, ma': [42.2835, -71.2356],
    'needham, massachusetts': [42.2835, -71.2356],
    'arlington, ma': [42.4153, -71.1564],
    'arlington, massachusetts': [42.4153, -71.1564],
    'belmont, ma': [42.3959, -71.1786],
    'belmont, massachusetts': [42.3959, -71.1786],
    'watertown, ma': [42.3709, -71.1828],
    'watertown, massachusetts': [42.3709, -71.1828],
    'natick, ma': [42.2834, -71.3495],
    'natick, massachusetts': [42.2834, -71.3495],
    'dedham, ma': [42.2418, -71.1661],
    'dedham, massachusetts': [42.2418, -71.1661],
    'milton, ma': [42.2496, -71.0662],
    'milton, massachusetts': [42.2496, -71.0662],
    'braintree, ma': [42.2057, -70.9999],
    'braintree, massachusetts': [42.2057, -70.9999],
    'randolph, ma': [42.1626, -71.0411],
    'randolph, massachusetts': [42.1626, -71.0411],
    'stoughton, ma': [42.1251, -71.1023],
    'stoughton, massachusetts': [42.1251, -71.1023],
    'canton, ma': [42.1584, -71.1448],
    'canton, massachusetts': [42.1584, -71.1448],
    'westwood, ma': [42.2126, -71.2245],
    'westwood, massachusetts': [42.2126, -71.2245],
    'norwood, ma': [42.1945, -71.1995],
    'norwood, massachusetts': [42.1945, -71.1995],
    'walpole, ma': [42.1417, -71.2495],
    'walpole, massachusetts': [42.1417, -71.2495],
    'medfield, ma': [42.1876, -71.3062],
    'medfield, massachusetts': [42.1876, -71.3062],
    'millis, ma': [42.1626, -71.3578],
    'millis, massachusetts': [42.1626, -71.3578],
    'franklin, ma': [42.0834, -71.3967],
    'franklin, massachusetts': [42.0834, -71.3967],
    'foxborough, ma': [42.0654, -71.2478],
    'foxborough, massachusetts': [42.0654, -71.2478],
    'mansfield, ma': [42.0334, -71.2189],
    'mansfield, massachusetts': [42.0334, -71.2189],
    'norton, ma': [41.9667, -71.1870],
    'norton, massachusetts': [41.9667, -71.1870],
    'easton, ma': [42.0251, -71.1286],
    'easton, massachusetts': [42.0251, -71.1286],
    'sharon, ma': [42.1084, -71.1786],
    'sharon, massachusetts': [42.1084, -71.1786],
    'carver, ma': [41.8834, -70.7648],
    'carver, massachusetts': [41.8834, -70.7648],

    // Other major cities
    'new york, ny': [40.7505, -73.9934],
    'new york, new york': [40.7505, -73.9934],
    'chicago, il': [41.8781, -87.6298],
    'chicago, illinois': [41.8781, -87.6298],
    'los angeles, ca': [34.0522, -118.2437],
    'los angeles, california': [34.0522, -118.2437],
    'seattle, wa': [47.6062, -122.3321],
    'seattle, washington': [47.6062, -122.3321],
    'portland, or': [45.5152, -122.6784],
    'portland, oregon': [45.5152, -122.6784],
    'austin, tx': [30.2672, -97.7431],
    'austin, texas': [30.2672, -97.7431],
    'miami, fl': [25.7617, -80.1918],
    'miami, florida': [25.7617, -80.1918],
    'denver, co': [39.7392, -104.9903],
    'denver, colorado': [39.7392, -104.9903],
    'phoenix, az': [33.4484, -112.0740],
    'phoenix, arizona': [33.4484, -112.0740],
  };

  // Check if it's a zip code (5 digits)
  const zipMatch = cleanLocation.match(/^\d{5}$/);
  if (zipMatch) {
    const zip = zipMatch[0];
    if (zipCodeMap[zip]) {
      return zipCodeMap[zip];
    }
    
    // Try partial matches for nearby areas
    const zipPrefix = zip.substring(0, 3);
    for (const [zipCode, coords] of Object.entries(zipCodeMap)) {
      if (zipCode.startsWith(zipPrefix)) {
        return coords;
      }
    }
  }

  // Check city, state format
  if (cityStateMap[cleanLocation]) {
    return cityStateMap[cleanLocation];
  }

  // Try variations with common abbreviations
  const variations = [
    cleanLocation.replace(/\bmass\b/, 'massachusetts'),
    cleanLocation.replace(/\bmassachusetts\b/, 'ma'),
    cleanLocation.replace(/\bcalifornia\b/, 'ca'),
    cleanLocation.replace(/\bca\b/, 'california'),
    cleanLocation.replace(/\btexas\b/, 'tx'),
    cleanLocation.replace(/\btx\b/, 'texas'),
    cleanLocation.replace(/\bflorida\b/, 'fl'),
    cleanLocation.replace(/\bfl\b/, 'florida'),
  ];

  for (const variation of variations) {
    if (cityStateMap[variation]) {
      return cityStateMap[variation];
    }
  }

  return null;
};

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState(eventDataManager.getMergedEventData());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([42.3601, -71.0589]);
  const [mapZoom, setMapZoom] = useState(12);
  const [userZipCode, setUserZipCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [showEventsList, setShowEventsList] = useState(false);
  const [showLocationNotFound, setShowLocationNotFound] = useState(false);

  useEffect(() => {
    // Check for user's preferred zip code
    const checkUserZipCode = async () => {
      // First check localStorage for immediate redirect
      const storedZipCode = localStorage.getItem('userZipCode');
      if (storedZipCode) {
        const coords = getLocationCoordinates(storedZipCode);
        if (coords) {
          setMapCenter(coords);
          setMapZoom(13);
          setUserZipCode(storedZipCode);
          setCurrentLocation(storedZipCode);
          // Clear from localStorage after using it
          localStorage.removeItem('userZipCode');
        }
        return;
      }

      // Then check user profile in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('zip_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.zip_code) {
          const coords = getLocationCoordinates(profile.zip_code);
          if (coords) {
            setMapCenter(coords);
            setMapZoom(13);
            setUserZipCode(profile.zip_code);
            setCurrentLocation(profile.zip_code);
          }
        }
      }
    };

    checkUserZipCode();
  }, []);

  useEffect(() => {
    // Listen for event data updates
    const unsubscribe = eventDataManager.addListener(() => {
      console.log('Event data updated, refreshing map...');
      const mergedData = eventDataManager.getMergedEventData();
      applyFilters(mergedData);
      // Force map to re-render with new data
      setMapKey(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Listen for admin event creation
  useEffect(() => {
    const handleAdminEventCreated = () => {
      console.log('Admin event created, refreshing map data...');
      // Force refresh the event data manager
      eventDataManager.refresh().then(() => {
        const mergedData = eventDataManager.getMergedEventData();
        applyFilters(mergedData);
        setMapKey(prev => prev + 1);
        console.log('Map refreshed with new admin event');
      });
    };

    window.addEventListener('adminEventCreated', handleAdminEventCreated);
    return () => {
      window.removeEventListener('adminEventCreated', handleAdminEventCreated);
    };
  }, []);

  const applyFilters = (data: any) => {
    let filtered = data;

    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filterCleanupDataByDateRange(filtered, dateRange.startDate, dateRange.endDate);
    }

    // Apply event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filterCleanupDataByEventType(filtered, selectedEventTypes);
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    const mergedData = eventDataManager.getMergedEventData();
    applyFilters(mergedData);
  }, [dateRange, selectedEventTypes]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Get initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const coords = getLocationCoordinates(searchQuery.trim());
    if (coords) {
      setMapCenter(coords);
      setMapZoom(13);
      setCurrentLocation(searchQuery.trim());
      setUserZipCode(null); // Clear user zip code indicator since this is a search
      setShowEventsList(true);
      setShowLocationNotFound(false);
      setMapKey(prev => prev + 1);
    } else {
      // Show location not found message
      setShowLocationNotFound(true);
      // Hide the message after 8 seconds
      setTimeout(() => {
        setShowLocationNotFound(false);
      }, 8000);
    }
  };

  const getFeatureStyle = (feature: any) => {
    const { eventType } = feature.properties;
    
    switch (eventType) {
      case 'treePlanting':
        return {
          fillColor: '#10b981',
          weight: 2,
          opacity: 1,
          color: '#047857',
          dashArray: '',
          fillOpacity: 0.7
        };
      case 'garden':
        return {
          fillColor: '#f59e0b',
          weight: 2,
          opacity: 1,
          color: '#b45309',
          dashArray: '',
          fillOpacity: 0.7
        };
      default:
        return {
          fillColor: '#3b82f6',
          weight: 2,
          opacity: 1,
          color: '#1d4ed8',
          dashArray: '',
          fillOpacity: 0.7
        };
    }
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on('click', () => {
      navigate(`/event/${encodeURIComponent(feature.properties.name)}`);
    });
    
    if (feature.properties) {
      const { eventType, trees, plots, time, location } = feature.properties;
      let tooltipContent;
      
      switch (eventType) {
        case 'treePlanting':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Trees to Plant: ${trees}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
          break;
        case 'garden':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Garden Plots: ${plots}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
          break;
        default:
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
      }
      
      layer.bindTooltip(tooltipContent, { sticky: true });
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'cleanup': return 'bg-blue-100 text-blue-800';
      case 'treePlanting': return 'bg-green-100 text-green-800';
      case 'garden': return 'bg-amber-100 text-amber-800';
      case 'education': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'cleanup': return 'Environmental Cleanup';
      case 'treePlanting': return 'Tree Planting';
      case 'garden': return 'Community Garden';
      case 'education': return 'Education';
      case 'workshop': return 'Workshop';
      default: return eventType;
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About', path: '/about' },
    { icon: BookOpen, label: 'Resources', path: '/resources' },
    { icon: Mail, label: 'Contact', path: '/contact' }
  ];

  // Debug function to check specific event
  const debugTestingEvent = () => {
    console.log('=== DEBUGGING TESTING EVENT ===');
    eventDataManager.debugEvent('Testing');
    console.log('Current filtered data features:', filteredData.features.map(f => f.properties.name));
    console.log('Map key:', mapKey);
    console.log('Filtered data:', filteredData);
    console.log('Map center:', mapCenter);
    console.log('Map zoom:', mapZoom);
    
    // Force a complete refresh
    eventDataManager.refresh().then(() => {
      const newData = eventDataManager.getMergedEventData();
      console.log('After refresh - merged data features:', newData.features.map(f => f.properties.name));
      applyFilters(newData);
      setMapKey(prev => prev + 1);
    });
  };

  // Add debug button (remove in production)
  useEffect(() => {
    // Auto-debug when component mounts
    setTimeout(() => {
      debugTestingEvent();
    }, 2000);
  }, []);

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar with search, filters and navigation */}
      <div className="w-80 bg-white shadow-lg z-[1001] overflow-y-auto">
        <div className="p-4">
          {/* Debug button - remove in production */}
          <button
            onClick={debugTestingEvent}
            className="mb-4 w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm"
          >
            Debug Testing Event
          </button>

          {/* Search Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Find Sustainability Events</h2>
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter zip code or city, state..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Search Events
              </button>
            </form>
            
            {/* Location Not Found Message */}
            {showLocationNotFound && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-amber-900 font-medium text-sm">Location Not Found</h4>
                    <p className="text-amber-800 text-sm mt-1">
                      We don't currently support events in this area, but our platform will be available in all locations in the near future!
                    </p>
                    <p className="text-amber-700 text-xs mt-2">
                      Try searching for a Massachusetts zip code or city for now.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Location Indicator */}
            {(currentLocation || userZipCode) && !showLocationNotFound && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <p className="text-emerald-800 text-sm font-medium">
                    {currentLocation ? `Showing events near ${currentLocation}` : `Showing events near ${userZipCode}`}
                  </p>
                </div>
                {userZipCode && !currentLocation && (
                  <p className="text-emerald-700 text-xs mt-1">
                    From your profile preferences
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Events List Toggle */}
          {filteredData.features.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowEventsList(!showEventsList)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {showEventsList ? 'Hide Events List' : `Show Events List (${filteredData.features.length})`}
              </button>
            </div>
          )}

          {/* Events List */}
          {showEventsList && (
            <div className="mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Events in This Area</h3>
              <div className="space-y-3">
                {filteredData.features.map((feature: any, index: number) => (
                  <div
                    key={`${feature.properties.name}-${index}`}
                    className="border border-gray-200 rounded-lg p-3 hover:border-emerald-500 transition-colors cursor-pointer"
                    onClick={() => navigate(`/event/${encodeURIComponent(feature.properties.name)}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{feature.properties.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(feature.properties.eventType)}`}>
                        {getEventTypeLabel(feature.properties.eventType)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(feature.properties.date).toLocaleDateString()}</span>
                      </div>
                      
                      {feature.properties.time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{feature.properties.time}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{feature.properties.location}</span>
                      </div>
                      
                      {feature.properties.eventType === 'treePlanting' && feature.properties.trees && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{feature.properties.trees} trees to plant</span>
                        </div>
                      )}
                      
                      {feature.properties.eventType === 'garden' && feature.properties.plots && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{feature.properties.plots} garden plots</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            onEventTypeChange={setSelectedEventTypes}
            dateRange={dateRange}
            selectedEventTypes={selectedEventTypes}
          />
          
          {/* Navigation Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Navigation</h3>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              {/* Authentication Button */}
              <div className="flex justify-center mt-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    className="flex items-center space-x-3 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login / Sign Up</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map container */}
      <div className="flex-1">
        <MapContainer
          key={`${mapKey}-${mapCenter[0]}-${mapCenter[1]}`}
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredData.features.map((feature: any, index: number) => (
            <GeoJSON
              key={`${feature.properties.name}-${index}-${feature.properties.updated_at || 'static'}-${mapKey}`}
              data={feature}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          ))}
        </MapContainer>
      </div>
      
      {/* Legend positioned fixed in bottom right corner */}
      <div className="fixed bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;