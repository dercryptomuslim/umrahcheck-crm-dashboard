import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function CtaSupport() {
  const handleEmailSupport = () => {
    window.location.href =
      'mailto:support@umrahcheck.de?subject=UmrahCheck CRM Support Request';
  };

  const handleLiveChat = () => {
    // Integration mit Intercom, Zendesk, oder ähnlichem
    alert('Live Chat wird geöffnet...');
  };

  const handleDocumentation = () => {
    window.open('https://docs.umrahcheck.de', '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='hidden sm:flex'>
          <MessageCircle className='h-4 w-4' />
          <span className='ml-2 hidden md:block'>Support</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
        <DropdownMenuLabel>📞 Need Help?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleEmailSupport}>
            <Mail className='mr-2 h-4 w-4' />
            Email Support
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLiveChat}>
            <MessageCircle className='mr-2 h-4 w-4' />
            Live Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDocumentation}>
            📚 Documentation
          </DropdownMenuItem>
          <DropdownMenuItem>🎥 Video Tutorials</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span className='text-muted-foreground text-xs'>
            Response time: ~2 hours
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
