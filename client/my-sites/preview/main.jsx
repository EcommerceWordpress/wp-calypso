/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { throttle } from 'lodash';
import React from 'react';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import {
	getSelectedSite,
	getSelectedSiteId,
} from 'state/ui/selectors';
import { isSitePreviewable } from 'state/sites/selectors';
import addQueryArgs from 'lib/route/add-query-args';
import { setLayoutFocus } from 'state/ui/layout-focus/actions';

import Button from 'components/button';
import DocumentHead from 'components/data/document-head';
import EmptyContent from 'components/empty-content';
import Gridicon from 'gridicons';
import Main from 'components/main';
import WebPreviewContent from 'components/web-preview/content';

const debug = debugFactory( 'calypso:my-sites:preview' );

class PreviewMain extends React.Component {

	static displayName = 'Preview';

	state = {
		previewUrl: null,
		externalUrl: null,
	};

	componentWillMount() {
		this.updateUrl();
	}

	updateUrl() {
		if ( ! this.props.site ) {
			if ( this.state.previewUrl !== null ) {
				debug( 'unloaded page' );
				this.setState( {
					previewUrl: null,
					externalUrl: null,
				} );
			}
			return;
		}

		const baseUrl = this.getBasePreviewUrl();
		const newUrl = addQueryArgs( {
			preview: true,
			iframe: true,
			'frame-nonce': this.props.site.options.frame_nonce
		}, baseUrl );

		if ( this.iframeUrl !== newUrl ) {
			debug( 'loading', newUrl );
			this.setState( {
				previewUrl: newUrl,
				externalUrl: this.props.site.URL,
			} );
		}
	}

	getBasePreviewUrl() {
		return this.props.site.options.unmapped_url;
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.siteId !== prevProps.siteId ) {
			debug( 'site change detected' );
			this.updateUrl();
		}
	}

	updateSiteLocation = ( pathname ) => {
		this.setState( {
			externalUrl: this.props.site.URL + ( pathname === '/' ? '' : pathname )
		} );
	}

	focusSidebar = () => {
		this.props.setLayoutFocus( 'sidebar' );
	}

	render() {
		const { translate, isPreviewable, site } = this.props;

		if ( ! site ) {
			// todo: some loading state?
			return null;
		}

		if ( ! isPreviewable ) {
			const action = (
				<Button primary icon href={ site.URL } target="_blank">
					{ translate( 'Open' ) }
					<Gridicon icon="external" />
				</Button>
			);

			return (
				<EmptyContent
					title={ translate( 'Unable to show your site here' ) }
					line={ translate( 'To view your site, click the button below' ) }
					action={ action }
					illustration={ '/calypso/images/illustrations/illustration-404.svg' }
					illustrationWidth={ 350 }
				/>
			);
		}

		return (
			<Main className="preview">
				<DocumentHead title={ translate( 'Site Preview' ) } />
				<WebPreviewContent
					onLocationUpdate={ this.updateSiteLocation }
					showUrl={ !! this.state.externalUrl }
					showClose={ this._isMobile }
					onClose={ this.focusSidebar }
					previewUrl={ this.state.previewUrl }
					externalUrl={ this.state.externalUrl }
				/>
			</Main>
		);
	}
}

const mapState = ( state ) => {
	const selectedSiteId = getSelectedSiteId( state );
	return {
		isPreviewable: isSitePreviewable( state, selectedSiteId ),
		site: getSelectedSite( state ),
		siteId: selectedSiteId,
	};
};

export default connect( mapState, { setLayoutFocus } )( localize( PreviewMain ) );
