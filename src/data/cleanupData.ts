// This file contains mock GeoJSON data for environmental cleanup areas
// in the continental United States

export const cleanupData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Great Lakes Plastic Pollution",
        type: "Water Pollution",
        priority: "high",
        date: "2023-09-15",
        description: "Plastic waste accumulation in the Great Lakes region affecting wildlife and water quality."
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
        date: "2023-06-22",
        description: "Remaining contamination from historical oil spills requiring remediation."
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
        date: "2023-11-03",
        description: "Former industrial sites with soil contamination requiring remediation."
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
        date: "2024-01-15",
        description: "Post-wildfire cleanup of ash and debris that could contaminate water sources."
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
        date: "2023-08-05",
        description: "Abandoned mines leaching heavy metals into local water systems."
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
        date: "2024-02-20",
        description: "Areas requiring reforestation and habitat restoration."
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
        date: "2023-04-18",
        description: "Former industrial waste disposal site requiring containment and cleanup."
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
        date: "2023-12-01",
        description: "Restoration of natural water flow and removal of invasive species."
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
        date: "2024-03-10",
        description: "Areas affected by agricultural chemical runoff requiring mitigation."
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
        date: "2023-07-22",
        description: "Former mining sites requiring soil remediation and native plant restoration."
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
        date: "2024-01-05",
        description: "Urban waterway requiring cleanup of multiple contaminants from historical industrial use."
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
        date: "2023-10-12",
        description: "Improper disposal of solar panel components requiring specialized cleanup."
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
    }
  ]
};