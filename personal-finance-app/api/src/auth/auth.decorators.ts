import { SetMetadata } from '@nestjs/common';

export const SKIP_CF_AUTH = 'skipCfAuth';
export const SkipCfAuth = () => SetMetadata(SKIP_CF_AUTH, true);
