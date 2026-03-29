import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { CompanyProfile, TickerFinancials } from '../hooks/useTickerDetail';

interface TickerDataState {
  symbol: string;
  profile: CompanyProfile | null;
  financials: TickerFinancials | null;
  realtimePrice: number;
  priceChange: number;
  priceChangePct: number;
}

interface TickerDataCtx extends TickerDataState {
  setTickerData: (data: Partial<TickerDataState>) => void;
  clearTickerData: () => void;
}

const EMPTY: TickerDataState = {
  symbol: '',
  profile: null,
  financials: null,
  realtimePrice: 0,
  priceChange: 0,
  priceChangePct: 0,
};

const TickerDataContext = createContext<TickerDataCtx>({
  ...EMPTY,
  setTickerData: () => {},
  clearTickerData: () => {},
});

export function TickerDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TickerDataState>(EMPTY);

  const setTickerData = useCallback((data: Partial<TickerDataState>) => {
    setState(prev => ({ ...prev, ...data }));
  }, []);

  const clearTickerData = useCallback(() => {
    setState(EMPTY);
  }, []);

  return (
    <TickerDataContext.Provider value={{ ...state, setTickerData, clearTickerData }}>
      {children}
    </TickerDataContext.Provider>
  );
}

export function useTickerData() {
  return useContext(TickerDataContext);
}
