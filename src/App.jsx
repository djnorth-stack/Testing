import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Settings, Plus, Trash2, Mail, Calculator } from 'lucide-react'
import './App.css'

// Conversion constants
const CONVERSIONS = {
  OZT_TO_GRAMS: 31.1034768,
  DWT_TO_GRAMS: 1.55517384,
  GR_TO_GRAMS: 0.06479891,
  KG_TO_GRAMS: 1000
}

// Default multipliers
const DEFAULT_MULTIPLIERS = {
  silver: 0.90,
  gold: 0.97,
  platinum: 0.92,
  palladium: 0.90
}

// Karat to fineness mapping
const KARAT_TO_FINENESS = {
  '24k': 1.0000,
  '22k': 0.9167,
  '18k': 0.7500,
  '14k': 0.5833,
  '10k': 0.4167
}

// Silver purity aliases
const SILVER_PURITIES = {
  'sterling': 0.925,
  'britannia': 0.958,
  'coin': 0.900,
  'junk': 0.800,
  '.9999': 0.9999,
  '.999': 0.999,
  '.925': 0.925,
  '.900': 0.900,
  '.800': 0.800
}

// Mock spot prices (CAD/ozt)
const MOCK_SPOT_PRICES = {
  silver: 32.50,
  gold: 2650.00,
  platinum: 1250.00,
  palladium: 1100.00
}

function App() {
  const [items, setItems] = useState([])
  const [inputText, setInputText] = useState('')
  const [spotPrices, setSpotPrices] = useState(MOCK_SPOT_PRICES)
  const [multipliers, setMultipliers] = useState(DEFAULT_MULTIPLIERS)
  const [showSettings, setShowSettings] = useState(false)
  const [roundingEnabled, setRoundingEnabled] = useState(true)

  // Parse input text to extract metal item details
  const parseInput = (input) => {
    const text = input.toLowerCase().trim()
    
    // Initialize result object
    const result = {
      originalText: input,
      metal: null,
      purity: null,
      weight: null,
      unit: null,
      faceValue: null
    }

    // Detect metal type
    if (text.includes('silver') || text.includes('ag')) {
      result.metal = 'silver'
    } else if (text.includes('gold') || text.includes('au')) {
      result.metal = 'gold'
    } else if (text.includes('platinum') || text.includes('pt')) {
      result.metal = 'platinum'
    } else if (text.includes('palladium') || text.includes('pd')) {
      result.metal = 'palladium'
    }

    // Check for face value (junk silver)
    const faceValueMatch = text.match(/\$(\d+\.?\d*)/)
    if (faceValueMatch && text.includes('junk')) {
      result.faceValue = parseFloat(faceValueMatch[1])
      result.metal = 'silver'
      result.purity = 0.800 // Default junk silver purity
      return result
    }

    // Extract purity
    const karatMatch = text.match(/(\d+)k/)
    if (karatMatch) {
      const karat = karatMatch[1] + 'k'
      result.purity = KARAT_TO_FINENESS[karat] || null
    }

    const decimalPurityMatch = text.match(/\.(\d{3,4})/)
    if (decimalPurityMatch) {
      result.purity = parseFloat('0.' + decimalPurityMatch[1])
    }

    // Check for silver aliases
    for (const [alias, purity] of Object.entries(SILVER_PURITIES)) {
      if (text.includes(alias)) {
        result.purity = purity
        break
      }
    }

    // Extract weight and unit
    const weightMatches = [
      { regex: /(\d+\.?\d*)\s*g(?:rams?)?/, unit: 'g' },
      { regex: /(\d+\.?\d*)\s*ozt/, unit: 'ozt' },
      { regex: /(\d+\.?\d*)\s*oz/, unit: 'ozt' },
      { regex: /(\d+\.?\d*)\s*dwt/, unit: 'dwt' },
      { regex: /(\d+\.?\d*)\s*gr/, unit: 'gr' },
      { regex: /(\d+\.?\d*)\s*kg/, unit: 'kg' },
      { regex: /(\d+\/\d+)\s*ozt/, unit: 'ozt' }, // Fraction support
    ]

    for (const { regex, unit } of weightMatches) {
      const match = text.match(regex)
      if (match) {
        let weight = match[1]
        // Handle fractions
        if (weight.includes('/')) {
          const [num, den] = weight.split('/').map(Number)
          weight = num / den
        } else {
          weight = parseFloat(weight)
        }
        result.weight = weight
        result.unit = unit
        break
      }
    }

    return result
  }

  // Convert weight to troy ounces
  const convertToOzt = (weight, unit) => {
    switch (unit) {
      case 'g':
        return weight / CONVERSIONS.OZT_TO_GRAMS
      case 'ozt':
        return weight
      case 'dwt':
        return (weight * CONVERSIONS.DWT_TO_GRAMS) / CONVERSIONS.OZT_TO_GRAMS
      case 'gr':
        return (weight * CONVERSIONS.GR_TO_GRAMS) / CONVERSIONS.OZT_TO_GRAMS
      case 'kg':
        return (weight * CONVERSIONS.KG_TO_GRAMS) / CONVERSIONS.OZT_TO_GRAMS
      default:
        return 0
    }
  }

  // Calculate pay price for an item
  const calculatePayPrice = (item) => {
    if (item.faceValue) {
      // Junk silver calculation (simplified)
      const fineGramsPerDollar = 18.0 // Approximate for 80% silver
      const fineGrams = item.faceValue * fineGramsPerDollar
      const fineOzt = fineGrams / CONVERSIONS.OZT_TO_GRAMS
      const baseValue = fineOzt * spotPrices[item.metal]
      let payPrice = baseValue * multipliers[item.metal]
      
      if (item.purity < 0.925) {
        payPrice *= 0.80 // Silver purity penalty
      }
      
      return roundingEnabled ? Math.floor(payPrice / 5) * 5 : payPrice
    }

    if (!item.weight || !item.purity || !item.metal) return 0

    const grossOzt = convertToOzt(item.weight, item.unit)
    const fineOzt = grossOzt * item.purity
    const baseValue = fineOzt * spotPrices[item.metal]
    let payPrice = baseValue * multipliers[item.metal]

    // Apply silver purity penalty
    if (item.metal === 'silver' && item.purity < 0.925) {
      payPrice *= 0.80
    }

    return roundingEnabled ? Math.floor(payPrice / 5) * 5 : payPrice
  }

  // Add new item
  const addItem = () => {
    if (!inputText.trim()) return

    const parsed = parseInput(inputText)
    if (!parsed.metal) {
      alert('Could not detect metal type. Please specify gold, silver, platinum, or palladium.')
      return
    }

    const newItem = {
      id: Date.now(),
      ...parsed,
      payPrice: 0
    }

    newItem.payPrice = calculatePayPrice(newItem)
    setItems([...items, newItem])
    setInputText('')
  }

  // Remove item
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      silver: 0,
      gold: 0,
      platinum: 0,
      palladium: 0,
      grand: 0
    }

    items.forEach(item => {
      if (item.payPrice) {
        totals[item.metal] += item.payPrice
        totals.grand += item.payPrice
      }
    })

    return totals
  }

  const totals = calculateTotals()

  // Recalculate prices when settings change
  useEffect(() => {
    setItems(items.map(item => ({
      ...item,
      payPrice: calculatePayPrice(item)
    })))
  }, [spotPrices, multipliers, roundingEnabled])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CORREIA</h1>
          <p className="text-slate-600">Precious Metals Valuation</p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Add Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="e.g., 403g sterling silver, 1/10 ozt .9999 gold bar"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="text-base"
            />
            <Button onClick={addItem} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.originalText}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.metal.toUpperCase()}
                        </Badge>
                        {item.purity && (
                          <Badge variant="outline" className="text-xs">
                            {(item.purity * 100).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${item.payPrice.toFixed(2)} CAD
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {totals.silver > 0 && (
                <div className="flex justify-between">
                  <span>Silver (Ag)</span>
                  <span className="font-semibold">${totals.silver.toFixed(2)}</span>
                </div>
              )}
              {totals.gold > 0 && (
                <div className="flex justify-between">
                  <span>Gold (Au)</span>
                  <span className="font-semibold">${totals.gold.toFixed(2)}</span>
                </div>
              )}
              {totals.platinum > 0 && (
                <div className="flex justify-between">
                  <span>Platinum (Pt)</span>
                  <span className="font-semibold">${totals.platinum.toFixed(2)}</span>
                </div>
              )}
              {totals.palladium > 0 && (
                <div className="flex justify-between">
                  <span>Palladium (Pd)</span>
                  <span className="font-semibold">${totals.palladium.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-green-600">${totals.grand.toFixed(2)} CAD</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          {items.length > 0 && (
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Email Quote
            </Button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Spot Prices (CAD/ozt)</h4>
                <div className="space-y-2">
                  {Object.entries(spotPrices).map(([metal, price]) => (
                    <div key={metal} className="flex justify-between items-center">
                      <span className="capitalize">{metal}</span>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setSpotPrices({
                          ...spotPrices,
                          [metal]: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Multipliers</h4>
                <div className="space-y-2">
                  {Object.entries(multipliers).map(([metal, multiplier]) => (
                    <div key={metal} className="flex justify-between items-center">
                      <span className="capitalize">{metal}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={multiplier}
                        onChange={(e) => setMultipliers({
                          ...multipliers,
                          [metal]: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Round to nearest $5</span>
                <Button
                  variant={roundingEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoundingEnabled(!roundingEnabled)}
                >
                  {roundingEnabled ? "ON" : "OFF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 py-4">
          <p>Private & Secure • Correia Precious Metals</p>
        </div>
      </div>
    </div>
  )
}

export default App

