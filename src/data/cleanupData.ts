// This file contains mock GeoJSON data for environmental cleanup areas
// and tree planting events in the continental United States

export const cleanupData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Charles River Cleanup Initiative",
        type: "Water Pollution",
        priority: "high",
        date: "2025-04-01",
        description: "Urban river cleanup focusing on plastic pollution and industrial runoff in the Charles River.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.12, 42.37],
          [-71.07, 42.37],
          [-71.07, 42.35],
          [-71.12, 42.35],
          [-71.12, 42.37]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Boston Harbor Islands Restoration",
        type: "Mixed Pollution",
        priority: "medium",
        date: "2025-05-15",
        description: "Marine ecosystem restoration and debris removal around Boston Harbor Islands.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-70.97, 42.33],
          [-70.92, 42.33],
          [-70.92, 42.30],
          [-70.97, 42.30],
          [-70.97, 42.33]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Emerald Necklace Tree Initiative",
        type: "Urban Reforestation",
        priority: "medium",
        date: "2025-04-20",
        description: "Community tree planting event along Boston's historic park system.",
        eventType: "treePlanting",
        trees: 250
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.12, 42.33],
          [-71.09, 42.33],
          [-71.09, 42.31],
          [-71.12, 42.31],
          [-71.12, 42.33]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Cambridge Urban Forest Expansion",
        type: "Street Tree Planting",
        priority: "low",
        date: "2025-05-01",
        description: "Street tree planting program in Cambridge neighborhoods.",
        eventType: "treePlanting",
        trees: 175
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.13, 42.39],
          [-71.10, 42.39],
          [-71.10, 42.37],
          [-71.13, 42.37],
          [-71.13, 42.39]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Great Lakes Plastic Pollution",
        type: "Water Pollution",
        priority: "high",
        date: "2025-09-15",
        description: "Plastic waste accumulation in the Great Lakes region affecting wildlife and water quality.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-87.5, 45.0],
          [-82.5, 45.0],
          [-82.5, 41.5],
          [-87.5, 41.5],
          [-87.5, 45.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Gulf Coast Oil Spill Residue",
        type: "Oil Pollution",
        priority: "high",
        date: "2025-06-22",
        description: "Remaining contamination from historical oil spills requiring remediation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-93.0, 30.0],
          [-88.0, 30.0],
          [-88.0, 28.0],
          [-93.0, 28.0],
          [-93.0, 30.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "New Jersey Industrial Zone",
        type: "Chemical Contamination",
        priority: "medium",
        date: "2025-11-03",
        description: "Former industrial sites with soil contamination requiring remediation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.5, 40.2],
          [-74.0, 40.2],
          [-74.0, 39.8],
          [-74.5, 39.8],
          [-74.5, 40.2]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "California Wildfire Aftermath",
        type: "Ash and Debris",
        priority: "medium",
        date: "2025-01-15",
        description: "Post-wildfire cleanup of ash and debris that could contaminate water sources.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.5, 39.0],
          [-121.5, 39.0],
          [-121.5, 38.0],
          [-122.5, 38.0],
          [-122.5, 39.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Colorado Mining Runoff",
        type: "Heavy Metal Contamination",
        priority: "high",
        date: "2025-08-05",
        description: "Abandoned mines leaching heavy metals into local water systems.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-107.0, 38.5],
          [-106.0, 38.5],
          [-106.0, 37.5],
          [-107.0, 37.5],
          [-107.0, 38.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Oregon Forest Restoration",
        type: "Deforestation",
        priority: "low",
        date: "2025-02-20",
        description: "Areas requiring reforestation and habitat restoration.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-123.0, 45.0],
          [-122.0, 45.0],
          [-122.0, 44.0],
          [-123.0, 44.0],
          [-123.0, 45.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ohio River Valley Waste Site",
        type: "Industrial Waste",
        priority: "medium",
        date: "2025-04-18",
        description: "Former industrial waste disposal site requiring containment and cleanup.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.5, 39.2],
          [-83.5, 39.2],
          [-83.5, 38.7],
          [-84.5, 38.7],
          [-84.5, 39.2]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Florida Everglades Restoration",
        type: "Habitat Degradation",
        priority: "medium",
        date: "2025-12-01",
        description: "Restoration of natural water flow and removal of invasive species.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-81.5, 26.0],
          [-80.5, 26.0],
          [-80.5, 25.0],
          [-81.5, 25.0],
          [-81.5, 26.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Texas Agricultural Runoff",
        type: "Chemical Fertilizer",
        priority: "low",
        date: "2025-03-10",
        description: "Areas affected by agricultural chemical runoff requiring mitigation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-97.5, 33.0],
          [-96.5, 33.0],
          [-96.5, 32.0],
          [-97.5, 32.0],
          [-97.5, 33.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Montana Mining Reclamation",
        type: "Soil Contamination",
        priority: "low",
        date: "2025-07-22",
        description: "Former mining sites requiring soil remediation and native plant restoration.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0, 46.5],
          [-111.0, 46.5],
          [-111.0, 46.0],
          [-112.0, 46.0],
          [-112.0, 46.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "New York Urban Waterway",
        type: "Mixed Pollution",
        priority: "high",
        date: "2025-01-05",
        description: "Urban waterway requiring cleanup of multiple contaminants from historical industrial use.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.0, 40.8],
          [-73.8, 40.8],
          [-73.8, 40.6],
          [-74.0, 40.6],
          [-74.0, 40.8]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Arizona Desert Solar Panel Waste",
        type: "Electronic Waste",
        priority: "medium",
        date: "2025-10-12",
        description: "Improper disposal of solar panel components requiring specialized cleanup.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0, 33.5],
          [-111.0, 33.5],
          [-111.0, 32.5],
          [-112.0, 32.5],
          [-112.0, 33.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Urban Forest Initiative - Seattle",
        type: "Urban Reforestation",
        priority: "medium",
        date: "2025-04-15",
        description: "Community tree planting event to increase urban canopy coverage.",
        eventType: "treePlanting",
        trees: 500
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.4, 47.7],
          [-122.2, 47.7],
          [-122.2, 47.5],
          [-122.4, 47.5],
          [-122.4, 47.7]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Portland Green Streets",
        type: "Street Tree Planting",
        priority: "low",
        date: "2025-05-01",
        description: "Street tree planting program to improve air quality and reduce urban heat island effect.",
        eventType: "treePlanting",
        trees: 300
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.7, 45.6],
          [-122.5, 45.6],
          [-122.5, 45.4],
          [-122.7, 45.4],
          [-122.7, 45.6]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Austin Green Belt Restoration",
        type: "Natural Area Restoration",
        priority: "medium",
        date: "2025-03-20",
        description: "Native tree planting event to restore natural habitat.",
        eventType: "treePlanting",
        trees: 1000
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-97.8, 30.3],
          [-97.6, 30.3],
          [-97.6, 30.1],
          [-97.8, 30.1],
          [-97.8, 30.3]
        ]]
      }
    }
  ]
};