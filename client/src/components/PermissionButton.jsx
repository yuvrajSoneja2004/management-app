import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission, getPermissionMessage } from '../utils/permissions';

/**
 * Button that respects user permissions
 * Shows disabled state and tooltip when user lacks permission
 */
const PermissionButton = ({
    userRole,
    requiredPermission,
    context = {},
    children,
    onClick,
    ...props
}) => {
    const canPerform = hasPermission(userRole, requiredPermission, context);
    const message = canPerform ? '' : getPermissionMessage(userRole, requiredPermission);

    if (!canPerform) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-block cursor-not-allowed">
                            <Button
                                {...props}
                                disabled
                                className="pointer-events-none"
                            >
                                {children}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{message}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Button onClick={onClick} {...props}>
            {children}
        </Button>
    );
};

export default PermissionButton;
