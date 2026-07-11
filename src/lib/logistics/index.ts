import { LogisticsProvider } from './types';
import { EkartProvider } from './ekart';

export * from './types';

export function getLogisticsProvider(): LogisticsProvider {
  const providerName = process.env.LOGISTICS_PROVIDER || 'ekart';
  
  switch (providerName.toLowerCase()) {
    case 'ekart':
    default:
      return new EkartProvider();
    // Add more providers here in the future:
    // case 'delhivery': return new DelhiveryProvider();
  }
}
