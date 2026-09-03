import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Thermometer, 
  Scale, 
  Ruler, 
  Droplet, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  RotateCcw, 
  ChevronDown,
  Clock,
  Sparkles
} from 'lucide-react';

// Structuring all supported category data & unit multipliers
interface Unit {
  id: string;
  name: string;
  suffix: string;
  multiplier: number; // Factor relative to the category's base unit
}

const UNIT_DATA: Record<string, {
  name: string;
  baseUnit: string;
  units: Unit[];
}> = {
  temperature: {
    name: "Temperature",
    baseUnit: "c",
    units: [
      { id: "c", name: "Celsius", suffix: "Â°C", multiplier: 1 },
      { id: "f", name: "Fahrenheit", suffix: "Â°F", multiplier: 1 },
      { id: "k", name: "Kelvin", suffix: "K", multiplier: 1 },
    ]
  },
  weight: {
    name: "Weight & Mass",
    baseUnit: "kg",
    units: [
      { id: "kg", name: "Kilograms", suffix: "kg", multiplier: 1 },
      { id: "g", name: "Grams", suffix: "g", multiplier: 0.001 },
      { id: "t", name: "Tonnes", suffix: "t", multiplier: 1000 },
      { id: "lb", name: "Pounds", suffix: "lb", multiplier: 0.45359237 },
      { id: "oz", name: "Ounces", suffix: "oz", multiplier: 0.028349523125 },
    ]
  },
  length: {
    name: "Length & Distance",
    baseUnit: "m",
    units: [
      { id: "m", name: "Meters", suffix: "m", multiplier: 1 },
      { id: "km", name: "Kilometers", suffix: "km", multiplier: 1000 },
      { id: "cm", name: "Centimeters", suffix: "cm", multiplier: 0.01 },
      { id: "mm", name: "Millimeters", suffix: "mm", multiplier: 0.001 },
      { id: "mi", name: "Miles", suffix: "mi", multiplier: 1609.344 },
      { id: "ft", name: "Feet", suffix: "ft", multiplier: 0.3048 },
      { id: "in", name: "Inches", suffix: "in", multiplier: 0.0254 },
    ]
  },
  volume: {
    name: "Volume & Capacity",
    baseUnit: "L",
    units: [
      { id: "L", name: "Liters", suffix: "L", multiplier: 1 },
      { id: "mL", name: "Milliliters", suffix: "mL", multiplier: 0.001 },
      { id: "gal", name: "Gallons (US)", suffix: "gal", multiplier: 3.785411784 },
      { id: "qt", name: "Quarts (US)", suffix: "qt", multiplier: 0.946352946 },
      { id: "cup", name: "Cups (US)", suffix: "cup", multiplier: 0.2365882365 },
      { id: "floz", name: "Fluid Ounces", suffix: "fl oz", multiplier: 0.0295735296 },
    ]
  }
};

const CATEGORIES = [
  { id: 'temperature', name: 'Temperature', icon: Thermometer },
  { id: 'weight', name: 'Weight', icon: Scale },
  { id: 'length', name: 'Length', icon: Ruler },
  { id: 'volume', name: 'Volume', icon: Droplet },
];

const CATEGORY_DEFAULTS: Record<string, { leftUnit: string; rightUnit: string; value: string }> = {
  temperature: { leftUnit: 'c', rightUnit: 'f', value: '32' },
  weight: { leftUnit: 'kg', rightUnit: 'lb', value: '1' },
  length: { leftUnit: 'm', rightUnit: 'ft', value: '1' },
  volume: { leftUnit: 'L', rightUnit: 'gal', value: '1' }
};

interface ComputationLog {
  id: string;
  expression: string;
  timestamp: string;
}

// General converter function with high fidelity
function convert(value: number, fromId: string, toId: string, category: string): number {
  if (fromId === toId) return value;

  if (category === "temperature") {
    let celsius = value;
    if (fromId === "f") {
      celsius = (value - 32) * 5 / 9;
    } else if (fromId === "k") {
      celsius = value - 273.15;
    }

    if (toId === "c") {
      return celsius;
    } else if (toId === "f") {
      return (celsius * 9 / 5) + 32;
    } else if (toId === "k") {
      return celsius + 273.15;
    }
    return value;
  }

  const catData = UNIT_DATA[category];
  if (!catData) return value;
  const fromUnit = catData.units.find(u => u.id === fromId);
  const toUnit = catData.units.find(u => u.id === toId);

  if (!fromUnit || !toUnit) return value;

  const baseValue = value * fromUnit.multiplier;
  return baseValue / toUnit.multiplier;
}

const formatResult = (num: number): string => {
  if (isNaN(num)) return '';
  if (Number.isInteger(num)) return num.toString();
  
  // Clean decimal precision matching Sleek Metrology bounds
  const formatValue = parseFloat(num.toFixed(6));
  if (formatValue === 0 && num !== 0) {
    return num.toExponential(4);
  }
  return formatValue.toString();
};

export default function App() {
  const [category, setCategory] = useState<string>('temperature');
  const [leftUnit, setLeftUnit] = useState<string>('c');
  const [rightUnit, setRightUnit] = useState<string>('f');
  
  const [leftValue, setLeftValue] = useState<string>('32');
  const [rightValue, setRightValue] = useState<string>('89.6');

  const [rotation, setRotation] = useState<number>(0);
  const [copiedLeft, setCopiedLeft] = useState<boolean>(false);
  const [copiedRight, setCopiedRight] = useState<boolean>(false);

  // Custom Dropdown Menus
  const [leftOpen, setLeftOpen] = useState<boolean>(false);
  const [rightOpen, setRightOpen] = useState<boolean>(false);

  // Recent Computation logging for real-time history bench
  const [history, setHistory] = useState<ComputationLog[]>([
    { id: '1', expression: '100 Â°C = 212 Â°F', timestamp: '10:00 AM' },
    { id: '2', expression: '1 kg = 2.20462 lb', timestamp: '10:01 AM' }
  ]);

  const currentUnits = UNIT_DATA[category]?.units || [];

  // Automatically update history on calculated values safely (with limit of 2 items)
  const addHistoryItem = (lVal: string, lUnitSuffix: string, rVal: string, rUnitSuffix: string) => {
    if (!lVal || !rVal || lVal === '-' || rVal === '-') return;
    const expr = `${lVal} ${lUnitSuffix} = ${rVal} ${rUnitSuffix}`;
    
    setHistory(prev => {
      // Don't duplicate consecutive identical operations
      if (prev.length > 0 && prev[0].expression === expr) return prev;
      
      const newLog: ComputationLog = {
        id: Date.now().toString(),
        expression: expr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return [newLog, ...prev.slice(0, 1)];
    });
  };

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const defaults = CATEGORY_DEFAULTS[catId];
    setLeftUnit(defaults.leftUnit);
    setRightUnit(defaults.rightUnit);
    setLeftValue(defaults.value);
    
    const parsed = parseFloat(defaults.value);
    if (!isNaN(parsed)) {
      const converted = convert(parsed, defaults.leftUnit, defaults.rightUnit, catId);
      const rFormat = formatResult(converted);
      setRightValue(rFormat);
      
      const lSuffix = UNIT_DATA[catId].units.find(u => u.id === defaults.leftUnit)?.suffix || '';
      const rSuffix = UNIT_DATA[catId].units.find(u => u.id === defaults.rightUnit)?.suffix || '';
      addHistoryItem(defaults.value, lSuffix, rFormat, rSuffix);
    } else {
      setRightValue('');
    }
    setLeftOpen(false);
    setRightOpen(false);
  };

  const filterAndFormat = (val: string): string => {
    let clean = val.replace(/[^0-9.-]/g, '');
    
    if (category !== 'temperature') {
      clean = clean.replace(/-/g, '');
    } else {
      if (clean.startsWith('-')) {
        clean = '-' + clean.slice(1).replace(/-/g, '');
      } else {
        clean = clean.replace(/-/g, '');
      }
    }

    const dotIndex = clean.indexOf('.');
    if (dotIndex !== -1) {
      const beforeDot = clean.slice(0, dotIndex + 1);
      const afterDot = clean.slice(dotIndex + 1).replace(/\./g, '');
      clean = beforeDot + afterDot;
    }

    return clean;
  };

  const handleLeftChange = (rawVal: string) => {
    const cleaned = filterAndFormat(rawVal);
    setLeftValue(cleaned);

    if (cleaned === '' || cleaned === '-') {
      setRightValue('');
      return;
    }

    const valueNum = parseFloat(cleaned);
    if (!isNaN(valueNum)) {
      const outcome = convert(valueNum, leftUnit, rightUnit, category);
      const formatted = formatResult(outcome);
      setRightValue(formatted);
      
      const lSuffix = currentUnits.find(u => u.id === leftUnit)?.suffix || '';
      const rSuffix = currentUnits.find(u => u.id === rightUnit)?.suffix || '';
      addHistoryItem(cleaned, lSuffix, formatted, rSuffix);
    } else {
      setRightValue('');
    }
  };

  const handleRightChange = (rawVal: string) => {
    const cleaned = filterAndFormat(rawVal);
    setRightValue(cleaned);

    if (cleaned === '' || cleaned === '-') {
      setLeftValue('');
      return;
    }

    const valueNum = parseFloat(cleaned);
    if (!isNaN(valueNum)) {
      const outcome = convert(valueNum, rightUnit, leftUnit, category);
      const formatted = formatResult(outcome);
      setLeftValue(formatted);

      const lSuffix = currentUnits.find(u => u.id === leftUnit)?.suffix || '';
      const rSuffix = currentUnits.find(u => u.id === rightUnit)?.suffix || '';
      addHistoryItem(formatted, lSuffix, cleaned, rSuffix);
    } else {
      setLeftValue('');
    }
  };

  const selectLeftUnit = (unitId: string) => {
    setLeftUnit(unitId);
    setLeftOpen(false);
    const parsed = parseFloat(leftValue);
    if (!isNaN(parsed)) {
      const result = convert(parsed, unitId, rightUnit, category);
      const formatted = formatResult(result);
      setRightValue(formatted);
      
      const lSuffix = currentUnits.find(u => u.id === unitId)?.suffix || '';
      const rSuffix = currentUnits.find(u => u.id === rightUnit)?.suffix || '';
      addHistoryItem(leftValue, lSuffix, formatted, rSuffix);
    }
  };

  const selectRightUnit = (unitId: string) => {
    setRightUnit(unitId);
    setRightOpen(false);
    const parsed = parseFloat(leftValue);
    if (!isNaN(parsed)) {
      const result = convert(parsed, leftUnit, unitId, category);
      const formatted = formatResult(result);
      setRightValue(formatted);

      const lSuffix = currentUnits.find(u => u.id === leftUnit)?.suffix || '';
      const rSuffix = currentUnits.find(u => u.id === unitId)?.suffix || '';
      addHistoryItem(leftValue, lSuffix, formatted, rSuffix);
    }
  };

  const handleSwap = () => {
    setRotation(prev => prev + 180);
    
    const tempLeftUnit = leftUnit;
    const tempRightUnit = rightUnit;
    setLeftUnit(tempRightUnit);
    setRightUnit(tempLeftUnit);

    const tempLeftVal = leftValue;
    const tempRightVal = rightValue;
    setLeftValue(tempRightVal);
    setRightValue(tempLeftVal);

    if (tempRightVal) {
      const lSuffix = currentUnits.find(u => u.id === tempRightUnit)?.suffix || '';
      const rSuffix = currentUnits.find(u => u.id === tempLeftUnit)?.suffix || '';
      addHistoryItem(tempRightVal, lSuffix, tempLeftVal, rSuffix);
    }
  };

  const handleCopy = (side: 'left' | 'right') => {
    const valueToCopy = side === 'left' ? leftValue : rightValue;
    const unitSuffix = currentUnits.find(u => u.id === (side === 'left' ? leftUnit : rightUnit))?.suffix || '';
    if (!valueToCopy) return;

    const fullString = `${valueToCopy} ${unitSuffix}`;
    navigator.clipboard.writeText(fullString);

    if (side === 'left') {
      setCopiedLeft(true);
      setTimeout(() => setCopiedLeft(false), 1500);
    } else {
      setCopiedRight(true);
      setTimeout(() => setCopiedRight(false), 1500);
    }
  };

  const handleReset = () => {
    const defaults = CATEGORY_DEFAULTS[category];
    setLeftValue(defaults.value);
    setLeftUnit(defaults.leftUnit);
    setRightUnit(defaults.rightUnit);
    
    const parsed = parseFloat(defaults.value);
    if (!isNaN(parsed)) {
      const converted = convert(parsed, defaults.leftUnit, defaults.rightUnit, category);
      const formatted = formatResult(converted);
      setRightValue(formatted);

      const lSuffix = UNIT_DATA[category].units.find(u => u.id === defaults.leftUnit)?.suffix || '';
      const rSuffix = UNIT_DATA[category].units.find(u => u.id === defaults.rightUnit)?.suffix || '';
      addHistoryItem(defaults.value, lSuffix, formatted, rSuffix);
    }
  };

  const getFormulaDescription = () => {
    const lUnit = currentUnits.find(u => u.id === leftUnit);
    const rUnit = currentUnits.find(u => u.id === rightUnit);
    if (!lUnit || !rUnit) return '';

    if (category === 'temperature') {
      if (leftUnit === 'c' && rightUnit === 'f') return 'T(Â°F) = T(Â°C) Ã— 9/5 + 32';
      if (leftUnit === 'f' && rightUnit === 'c') return 'T(Â°C) = (T(Â°F) âˆ’ 32) Ã— 5/9';
      if (leftUnit === 'c' && rightUnit === 'k') return 'T(K) = T(Â°C) + 273.15';
      if (leftUnit === 'k' && rightUnit === 'c') return 'T(Â°C) = T(K) âˆ’ 273.15';
      if (leftUnit === 'f' && rightUnit === 'k') return 'T(K) = (T(Â°F) âˆ’ 32) Ã— 5/9 + 273.15';
      if (leftUnit === 'k' && rightUnit === 'f') return 'T(Â°F) = (T(K) âˆ’ 273.15) Ã— 9/5 + 32';
      return '1 to 1 direct map';
    }

    const valueLeftInRight = convert(1, leftUnit, rightUnit, category);
    const valueRightInLeft = convert(1, rightUnit, leftUnit, category);
    return `1 ${lUnit.suffix} â‰ˆ ${formatResult(valueLeftInRight)} ${rUnit.suffix}  â€¢  1 ${rUnit.suffix} â‰ˆ ${formatResult(valueRightInLeft)} ${lUnit.suffix}`;
  };

  const clearHistoryLog = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen w-full ts-page-bg flex items-center justify-center font-sans overflow-y-auto p-4 md:p-8">
      
      {/* Sleek Theme Canvas Container */}
      <div className="max-w-xl w-full bg-white/40 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-6 md:p-10 relative">
        
        {/* Header matching 'Sleek Interface' styling */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Unit Converter</h1>
          <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest font-semibold">Precision Exchange</p>
        </div>

        {/* Categories Chips styled beautifully to match Sleek specification */}
        <div id="category-scroller" className="flex justify-start md:justify-center gap-3 overflow-x-auto scrollbar-none pb-2 mb-8">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isActive = category === cat.id;

            return (
              <button
                key={cat.id}
                id={`cat-chip-${cat.id}`}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-5 py-2.5 rounded-full flex items-center shrink-0 gap-2 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/50'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span className="text-xs md:text-sm font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dual Conversion Fields Column/Grid */}
        <div className="relative flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left Source Column Card */}
            <div className="bg-white/80 p-6 rounded-2xl border border-indigo-100 shadow-sm relative focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                Source Unit
              </label>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <input
                    id="left-input-field"
                    type="text"
                    inputMode="decimal"
                    value={leftValue}
                    onChange={(e) => handleLeftChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-3xl md:text-4xl font-light text-slate-800 outline-none w-full border-none p-0 focus:ring-0 font-sans"
                  />
                  {leftValue && (
                    <button
                      type="button"
                      onClick={() => handleCopy('left')}
                      className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                      title="Copy standard value"
                    >
                      {copiedLeft ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Dropdown Select wrapper */}
                <div className="relative">
                  <button
                    id="left-unit-dropdown"
                    type="button"
                    onClick={() => {
                      setLeftOpen(!leftOpen);
                      setRightOpen(false);
                    }}
                    className="flex items-center justify-between w-full mt-2 py-1 px-2 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 text-xs font-semibold cursor-pointer border border-indigo-100/30 transition-colors"
                  >
                    <span>{currentUnits.find(u => u.id === leftUnit)?.name} ({currentUnits.find(u => u.id === leftUnit)?.suffix})</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <AnimatePresence>
                    {leftOpen && (
                      <>
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setLeftOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-30 scrollbar-none"
                        >
                          {currentUnits.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => selectLeftUnit(u.id)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors cursor-pointer"
                            >
                              {u.name} ({u.suffix})
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Right Target Column Card */}
            <div className="bg-white/80 p-6 rounded-2xl border border-indigo-100 shadow-sm relative focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                Target Unit
              </label>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <input
                    id="right-input-field"
                    type="text"
                    inputMode="decimal"
                    value={rightValue}
                    onChange={(e) => handleRightChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-3xl md:text-4xl font-light text-slate-800 outline-none w-full border-none p-0 focus:ring-0 font-sans"
                  />
                  {rightValue && (
                    <button
                      type="button"
                      onClick={() => handleCopy('right')}
                      className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                      title="Copy result"
                    >
                      {copiedRight ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Dropdown Select wrapper */}
                <div className="relative">
                  <button
                    id="right-unit-dropdown"
                    type="button"
                    onClick={() => {
                      setRightOpen(!rightOpen);
                      setLeftOpen(false);
                    }}
                    className="flex items-center justify-between w-full mt-2 py-1 px-2 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 text-xs font-semibold cursor-pointer border border-indigo-100/30 transition-colors"
                  >
                    <span>{currentUnits.find(u => u.id === rightUnit)?.name} ({currentUnits.find(u => u.id === rightUnit)?.suffix})</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <AnimatePresence>
                    {rightOpen && (
                      <>
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setRightOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-30 scrollbar-none"
                        >
                          {currentUnits.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => selectRightUnit(u.id)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors cursor-pointer"
                            >
                              {u.name} ({u.suffix})
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

          </div>

          {/* Swap Button Overlay centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.button
              id="swap-action-btn"
              type="button"
              onClick={handleSwap}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:bg-indigo-700 hover:scale-105"
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Real-time Math Multipliers Info Banner */}
        <div className="mt-6 flex justify-between items-center bg-slate-50/70 py-2 px-3.5 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full sm:animate-pulse bg-indigo-500" />
            <span className="text-slate-500 font-mono truncate">{getFormulaDescription()}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer text-xs ml-2 rounded p-1 transition-colors hover:bg-slate-150"
            title="Restore Defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Recent Computations styled matching Design HTML */}
        <div className="mt-8 pt-6 border-t border-slate-200/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Computations</h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistoryLog}
                className="text-xs font-semibold text-indigo-500 hover:underline cursor-pointer"
              >
                Clear log
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.length === 0 ? (
              <div className="col-span-2 text-center py-4 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">No computations yet. Start entering values!</span>
              </div>
            ) : (
              history.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 bg-white/30 p-2.5 px-3.5 rounded-xl border border-white/40 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full shrink-0" />
                    <p className="text-xs text-slate-600 font-semibold font-mono truncate">{log.expression}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Info Footer from Sleek design */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400">Computational engine v4.2 â€¢ Instant Real-time Processing</p>
        </div>

      </div>

    </div>
  );
}


