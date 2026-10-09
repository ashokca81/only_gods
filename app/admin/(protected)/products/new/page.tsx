import ProductForm from '../ProductForm';
import { EMPTY_PRODUCT } from '../product-defaults';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  return <ProductForm initial={EMPTY_PRODUCT} />;
}
