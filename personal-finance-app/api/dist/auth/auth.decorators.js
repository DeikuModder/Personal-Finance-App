"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipCfAuth = exports.SKIP_CF_AUTH = void 0;
const common_1 = require("@nestjs/common");
exports.SKIP_CF_AUTH = 'skipCfAuth';
const SkipCfAuth = () => (0, common_1.SetMetadata)(exports.SKIP_CF_AUTH, true);
exports.SkipCfAuth = SkipCfAuth;
//# sourceMappingURL=auth.decorators.js.map